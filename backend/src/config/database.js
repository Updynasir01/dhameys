// src/config/database.js
// Dhameys Airlines — MongoDB via Mongoose

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhameys';
  mongoose.set('strictQuery', false);
  mongoose.connection.on('connected',    () => { isConnected = true;  logger.info('[MongoDB] Connected'); });
  mongoose.connection.on('disconnected', () => { isConnected = false; logger.warn('[MongoDB] Disconnected'); });
  mongoose.connection.on('error',        (err) => logger.error('[MongoDB] Error:', err.message));
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'dhameys',
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  });
}

// In-process seat lock cache (replace with MongoDB TTL collection in prod)
const seatLocks = new Map();
const _store    = new Map();

const cache = {
  async get(key) {
    const item = _store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) { _store.delete(key); return null; }
    return item.value;
  },
  async set(key, value, ttlSeconds = 900) {
    _store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  async del(key) { _store.delete(key); },
  /** Drop cached keys (e.g. search results) after flight mutations */
  async clearPrefix(prefix) {
    for (const k of _store.keys()) {
      if (k.startsWith(prefix)) _store.delete(k);
    }
  },
  async lockSeat(flightId, seatCode, bookingRef, ttlMinutes = 15) {
    seatLocks.set(`${flightId}:${seatCode}`, { bookingRef, expiresAt: Date.now() + ttlMinutes * 60000 });
  },
  async isSeatLocked(flightId, seatCode) {
    const lock = seatLocks.get(`${flightId}:${seatCode}`);
    if (!lock) return false;
    if (Date.now() > lock.expiresAt) { seatLocks.delete(`${flightId}:${seatCode}`); return false; }
    return true;
  },
  async unlockSeat(flightId, seatCode) { seatLocks.delete(`${flightId}:${seatCode}`); },
  cleanExpired() {
    const now = Date.now();
    for (const [k, v] of seatLocks.entries()) if (now > v.expiresAt) seatLocks.delete(k);
    for (const [k, v] of _store.entries()) if (v.expiresAt && now > v.expiresAt) _store.delete(k);
  },
};

async function checkConnections() {
  return { mongodb: mongoose.connection.readyState === 1 };
}

module.exports = { connectDB, cache, checkConnections };
