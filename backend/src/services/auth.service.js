// src/services/auth.service.js — MongoDB version
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode    = require('qrcode');
const crypto    = require('crypto');
const User         = require('../models/User');
const { RefreshToken } = require('../models/index');
const { EmailQueue }   = require('../config/rabbitmq');
const logger       = require('../utils/logger');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

function genAccess(user)  { return jwt.sign({ sub: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }); }
function genRefresh(user) { return jwt.sign({ sub: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }); }
async function storeRT(userId, token, req) {
  await RefreshToken.create({ user: userId, token, userAgent: req?.headers?.['user-agent'], ipAddress: req?.ip, expiresAt: new Date(Date.now() + 7*86400000) });
}
function tokens(access, refresh) {
  const d = jwt.decode(access);
  return { accessToken: access, refreshToken: refresh, expiresIn: d.exp - Math.floor(Date.now()/1000), tokenType: 'Bearer' };
}
function fmt(u) {
  return { id: u._id, email: u.email, role: u.role, firstName: u.firstName, lastName: u.lastName, status: u.status, emailVerified: u.emailVerified, twoFaEnabled: u.twoFaEnabled, loyaltyPoints: u.loyaltyPoints, loyaltyTier: u.loyaltyTier };
}

async function register(data, req) {
  const { email, password, firstName, lastName, phone, gdprConsent } = data;
  if (await User.findOne({ email: email.toLowerCase() })) throw Object.assign(new Error('Email already registered'), { status: 409 });
  const verifyToken   = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    email, phone: phone||undefined,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    firstName, lastName,
    gdprConsent: !!gdprConsent, gdprConsentDate: new Date(),
    emailVerifyToken: verifyToken, emailVerifyExpires: new Date(Date.now() + 86400000),
  });
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    await User.findByIdAndUpdate(user._id, {
      status: 'active',
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    });
    user.status = 'active';
    user.emailVerified = true;
  } else {
    await EmailQueue.sendVerification({ to: email, name: firstName, token: verifyToken, url: `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}` }).catch(()=>{});
  }
  return fmt(user);
}

async function login(email, password, req) {
  const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+passwordHash +twoFaSecret');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (user.status === 'suspended') throw Object.assign(new Error('Account suspended'), { status: 403 });
  // pending_verification: block login unless dev, SKIP_EMAIL_VERIFICATION, or already handled below
  if (user.status === 'pending_verification') {
    const allowWithoutLink =
      process.env.NODE_ENV === 'development' ||
      process.env.SKIP_EMAIL_VERIFICATION === 'true';
    if (allowWithoutLink) {
      await User.findByIdAndUpdate(user._id, {
        status: 'active',
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      });
      user.status = 'active';
      user.emailVerified = true;
    } else {
      throw Object.assign(new Error('Please verify your email first'), { status: 403 });
    }
  }
  if (user.twoFaEnabled) {
    const temp = jwt.sign({ sub: user._id, twoFaPending: true }, process.env.JWT_SECRET, { expiresIn: '5m' });
    return { requiresTwoFa: true, tempToken: temp };
  }
  user.lastLogin = new Date(); await user.save();
  const a = genAccess(user), r = genRefresh(user);
  await storeRT(user._id, r, req);
  return { user: fmt(user), tokens: tokens(a, r) };
}

async function verify2FA(tempToken, totpCode, req) {
  let payload;
  try { payload = jwt.verify(tempToken, process.env.JWT_SECRET); } catch { throw Object.assign(new Error('Invalid token'), { status: 401 }); }
  const user = await User.findById(payload.sub).select('+twoFaSecret');
  if (!user || !speakeasy.totp.verify({ secret: user.twoFaSecret, encoding: 'base32', token: totpCode, window: 1 }))
    throw Object.assign(new Error('Invalid 2FA code'), { status: 401 });
  user.lastLogin = new Date(); await user.save();
  const a = genAccess(user), r = genRefresh(user);
  await storeRT(user._id, r, req);
  return { user: fmt(user), tokens: tokens(a, r) };
}

async function setup2FA(userId) {
  const user = await User.findById(userId);
  const secret = speakeasy.generateSecret({ name: `Dhameys (${user.email})`, issuer: 'Dhameys', length: 20 });
  await User.findByIdAndUpdate(userId, { twoFaSecret: secret.base32 });
  return { secret: secret.base32, qrCode: await QRCode.toDataURL(secret.otpauth_url), otpauthUrl: secret.otpauth_url };
}

async function enable2FA(userId, totpCode) {
  const user = await User.findById(userId).select('+twoFaSecret');
  if (!user?.twoFaSecret) throw Object.assign(new Error('Run setup first'), { status: 400 });
  if (!speakeasy.totp.verify({ secret: user.twoFaSecret, encoding: 'base32', token: totpCode, window: 1 }))
    throw Object.assign(new Error('Invalid code'), { status: 400 });
  const codes = Array.from({length:8}, ()=>crypto.randomBytes(4).toString('hex').toUpperCase());
  await User.findByIdAndUpdate(userId, { twoFaEnabled: true, twoFaBackupCodes: codes });
  return { enabled: true, backupCodes: codes };
}

async function disable2FA(userId, password) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!(await bcrypt.compare(password, user.passwordHash))) throw Object.assign(new Error('Invalid password'), { status: 401 });
  await User.findByIdAndUpdate(userId, { twoFaEnabled: false, twoFaSecret: null, twoFaBackupCodes: [] });
  return { disabled: true };
}

async function refreshTokens(refreshToken, req) {
  let payload;
  try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); } catch { throw Object.assign(new Error('Invalid refresh token'), { status: 401 }); }
  const stored = await RefreshToken.findOne({ token: refreshToken, revoked: false }).where('expiresAt').gt(new Date());
  if (!stored) throw Object.assign(new Error('Token revoked'), { status: 401 });
  await RefreshToken.findByIdAndUpdate(stored._id, { revoked: true });
  const user = await User.findById(payload.sub);
  const a = genAccess(user), r = genRefresh(user);
  await storeRT(user._id, r, req);
  return tokens(a, r);
}

async function logout(userId, refreshToken) {
  if (refreshToken) await RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
}

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  await User.findByIdAndUpdate(user._id, { resetToken: token, resetTokenExpires: new Date(Date.now() + 3600000) });
  await EmailQueue.sendPasswordReset({ to: email, name: user.firstName, token, url: `${process.env.FRONTEND_URL}/reset-password?token=${token}` }).catch(()=>{});
}

async function resetPassword(token, newPassword) {
  const user = await User.findOne({ resetToken: token }).where('resetTokenExpires').gt(new Date());
  if (!user) throw Object.assign(new Error('Invalid or expired token'), { status: 400 });
  await User.findByIdAndUpdate(user._id, { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), resetToken: null, resetTokenExpires: null });
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });
}

async function verifyEmail(token) {
  const user = await User.findOne({ emailVerifyToken: token }).where('emailVerifyExpires').gt(new Date());
  if (!user) throw Object.assign(new Error('Invalid or expired token'), { status: 400 });
  await User.findByIdAndUpdate(user._id, { emailVerified: true, status: 'active', emailVerifyToken: null, emailVerifyExpires: null });
}

async function requestDataDeletion(userId) {
  const date = new Date(Date.now() + 30*86400000);
  await User.findByIdAndUpdate(userId, { dataDeletionRequested: true, dataDeletionDate: date });
  await RefreshToken.updateMany({ user: userId }, { revoked: true });
  return { scheduledFor: date };
}

async function executeDataDeletion(userId) {
  await User.findByIdAndUpdate(userId, { email: `deleted_${userId}@deleted.dhameys`, phone: null, passwordHash: 'DELETED', firstName: 'Deleted', lastName: 'User', dateOfBirth: null, passportNumber: null, twoFaSecret: null, deletedAt: new Date() });
  await RefreshToken.deleteMany({ user: userId });
}

module.exports = { register, login, verify2FA, setup2FA, enable2FA, disable2FA, refreshTokens, logout, forgotPassword, resetPassword, verifyEmail, requestDataDeletion, executeDataDeletion };
