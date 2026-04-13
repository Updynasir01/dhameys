// src/middleware/security.middleware.js — MongoDB version
const { v4: uuidv4 } = require('uuid');
const { AuditLog }   = require('../models/index');
const User           = require('../models/User');
const Booking        = require('../models/Booking');
const Ticket         = require('../models/Ticket');
const { LoyaltyTransaction, Notification } = require('../models/index');
const logger = require('../utils/logger');

function additionalSecurityHeaders(req, res, next) {
  res.setHeader('X-Request-ID', req.requestId || uuidv4());
  res.removeHeader('X-Powered-By');
  next();
}

async function auditLog(userId, action, entity, entityId, oldData, newData, req) {
  try {
    await AuditLog.create({ user: userId, action, entity, entityId, oldData, newData, ipAddress: req?.ip, userAgent: req?.headers?.['user-agent'] });
  } catch (err) { logger.warn('Audit log failed:', err.message); }
}

async function exportUserData(userId) {
  const [user, bookings, tickets, loyalty, notifications] = await Promise.all([
    User.findById(userId).select('email phone firstName lastName dateOfBirth nationality preferredCurrency loyaltyPoints loyaltyTier gdprConsent marketingConsent createdAt').lean(),
    Booking.find({ user: userId }).select('bookingRef status totalAmount currency confirmedAt createdAt').lean(),
    Ticket.find({ booking: { $in: (await Booking.find({ user: userId }).select('_id').lean()).map(b => b._id) } }).select('ticketNumber pnrCode status createdAt').lean(),
    LoyaltyTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  return { exportedAt: new Date().toISOString(), profile: user, bookings, tickets, loyaltyHistory: loyalty, notifications };
}

module.exports = { additionalSecurityHeaders, auditLog, exportUserData };
