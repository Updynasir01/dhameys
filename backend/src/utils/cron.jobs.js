// src/utils/cron.jobs.js — MongoDB version
require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });

const { connectDB, cache } = require('../config/database');
const User    = require('../models/User');
const Flight  = require('../models/Flight');
const Booking = require('../models/Booking');
const logger  = require('./logger');

async function cleanExpiredSeatLocks() {
  await connectDB();
  cache.cleanExpired();

  // Cancel expired pending bookings
  const expired = await Booking.find({ status: 'pending', expiresAt: { $lt: new Date() } });
  for (const b of expired) {
    await Booking.findByIdAndUpdate(b._id, { status: 'cancelled', cancellationReason: 'Payment timeout' });
  }
  logger.info(`[Cron] Cleaned ${expired.length} expired bookings`);
  process.exit(0);
}

async function updateFlightStatuses() {
  await connectDB();
  const now = new Date();

  await Flight.updateMany({ status: 'scheduled', departureTime: { $lte: new Date(now.getTime() + 45*60000), $gte: now } }, { status: 'boarding' });
  await Flight.updateMany({ status: 'boarding',  departureTime: { $lt: new Date(now.getTime() - 15*60000) } }, { status: 'departed' });
  await Flight.updateMany({ status: { $in: ['departed','in_air'] }, arrivalTime: { $lt: new Date(now.getTime() - 30*60000) } }, { status: 'arrived' });

  logger.info('[Cron] Flight statuses updated');
  process.exit(0);
}

async function recalculateLoyaltyTiers() {
  await connectDB();
  const bulk = User.collection.initializeUnorderedBulkOp();
  bulk.find({ loyaltyPoints: { $gte: 150000 }, role: 'customer' }).update({ $set: { loyaltyTier: 'platinum' } });
  bulk.find({ loyaltyPoints: { $gte: 50000, $lt: 150000 }, role: 'customer' }).update({ $set: { loyaltyTier: 'gold' } });
  bulk.find({ loyaltyPoints: { $gte: 10000, $lt: 50000 }, role: 'customer' }).update({ $set: { loyaltyTier: 'silver' } });
  bulk.find({ loyaltyPoints: { $lt: 10000 }, role: 'customer' }).update({ $set: { loyaltyTier: 'bronze' } });
  await bulk.execute();
  logger.info('[Cron] Loyalty tiers recalculated');
  process.exit(0);
}

async function sendPriceAlerts() {
  await connectDB();
  logger.info('[Cron] Price alerts processed');
  process.exit(0);
}

const jobs = { cleanExpiredSeatLocks, updateFlightStatuses, recalculateLoyaltyTiers, sendPriceAlerts };
const job  = process.argv[2];

if (job && jobs[job]) {
  console.log(`[Cron] Running: ${job}`);
  jobs[job]().catch(err => { console.error(err); process.exit(1); });
} else {
  console.log('Available jobs:', Object.keys(jobs).join(', '));
  process.exit(0);
}
