// src/middleware/auth.middleware.js — MongoDB version
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('_id email role status');
    if (!user)                       return res.status(401).json({ error: 'User not found' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('_id email role status');
      if (user) req.user = user;
    }
  } catch (_) {}
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

const requireAdmin      = requireRole('admin','superadmin');
const requireAgent      = requireRole('agent','admin','superadmin');
const requireSuperAdmin = requireRole('superadmin');

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, requireAgent, requireSuperAdmin };
