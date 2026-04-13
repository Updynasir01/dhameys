// src/controllers/auth.controller.js
const authService = require('../services/auth.service');

async function register(req, res) {
  const user = await authService.register(req.body, req);
  res.status(201).json({ success: true, message: 'Registration successful. Please verify your email.', data: user });
}

async function login(req, res) {
  const result = await authService.login(req.body.email, req.body.password, req);
  res.json({ success: true, data: result });
}

async function logout(req, res) {
  const refresh = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logout(req.user.id, refresh);
  res.json({ success: true, message: 'Logged out' });
}

async function refresh(req, res) {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) return res.status(400).json({ error: 'Refresh token required' });
  const tokens = await authService.refreshTokens(token, req);
  res.json({ success: true, data: tokens });
}

async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email);
  // Always return 200 to prevent email enumeration
  res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, message: 'Password reset successfully. Please log in.' });
}

async function verifyEmail(req, res) {
  await authService.verifyEmail(req.body.token || req.query.token);
  res.json({ success: true, message: 'Email verified. You can now log in.' });
}

async function setup2FA(req, res) {
  const data = await authService.setup2FA(req.user.id);
  res.json({ success: true, data });
}

async function enable2FA(req, res) {
  const data = await authService.enable2FA(req.user.id, req.body.code);
  res.json({ success: true, data });
}

async function verify2FA(req, res) {
  const result = await authService.verify2FA(req.body.tempToken, req.body.code, req);
  res.json({ success: true, data: result });
}

async function disable2FA(req, res) {
  const data = await authService.disable2FA(req.user.id, req.body.password);
  res.json({ success: true, data });
}

module.exports = {
  register, login, logout, refresh,
  forgotPassword, resetPassword, verifyEmail,
  setup2FA, enable2FA, verify2FA, disable2FA,
};
