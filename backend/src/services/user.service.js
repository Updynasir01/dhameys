// src/services/user.service.js — MongoDB version
const bcrypt  = require('bcrypt');
const User    = require('../models/User');
const Booking = require('../models/Booking');
const { LoyaltyTransaction } = require('../models/index');
const authService = require('./auth.service');

async function getProfile(userId) {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

async function updateProfile(userId, data) {
  const allowed = ['title','firstName','lastName','phone','dateOfBirth','gender','nationality',
    'preferredCurrency','preferredLanguage','preferredCabin','mealPreference','seatPreference',
    'marketingConsent','passportNumber','passportExpiry','passportCountry'];
  const update = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) update[k] = v;
  }
  if (!Object.keys(update).length) throw Object.assign(new Error('No valid fields'), { status: 400 });
  return User.findByIdAndUpdate(userId, update, { new: true });
}

async function changePassword(userId, currentPw, newPw) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!(await bcrypt.compare(currentPw, user.passwordHash)))
    throw Object.assign(new Error('Current password incorrect'), { status: 401 });
  const hash = await bcrypt.hash(newPw, parseInt(process.env.BCRYPT_ROUNDS || '12'));
  await User.findByIdAndUpdate(userId, { passwordHash: hash });
}

async function getLoyalty(userId) {
  const user = await User.findById(userId).select('loyaltyPoints loyaltyTier');
  const transactions = await LoyaltyTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
  return { loyaltyPoints: user.loyaltyPoints, loyaltyTier: user.loyaltyTier, transactions };
}

async function getUserBookings(userId, { page = 1, limit = 10, status } = {}) {
  const q = { user: userId };
  if (status) q.status = status;
  const [bookings, total] = await Promise.all([
    Booking.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
    Booking.countDocuments(q),
  ]);
  return { bookings, total, page: parseInt(page), limit: parseInt(limit) };
}

async function deleteAccount(userId) {
  return authService.requestDataDeletion(userId);
}

module.exports = { getProfile, updateProfile, changePassword, getLoyalty, getUserBookings, deleteAccount };
