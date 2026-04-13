// src/services/admin.service.js — MongoDB version
const User    = require('../models/User');
const Booking = require('../models/Booking');
const Flight  = require('../models/Flight');
const Payment = require('../models/Payment');
const { PromoCode, Setting } = require('../models/index');
const { cache } = require('../config/database');

async function getDashboardStats() {
  const [bookingStats, revenueStats, userStats, flightStats, topRoutes, recentBookings] = await Promise.all([
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$currency', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { role: 'customer', deletedAt: null } },
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status','active'] }, 1, 0] } } } },
    ]),
    Flight.aggregate([
      { $match: { departureTime: { $gt: new Date() } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: new Date(Date.now() - 30*86400000) } } },
      { $unwind: '$flights' },
      { $group: { _id: { origin: '$flights.originIata', dest: '$flights.destIata' }, bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { bookings: -1 } }, { $limit: 10 },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(10).populate('user', 'email').lean(),
  ]);

  const bs = {}; for (const b of bookingStats) bs[b._id] = b.count;
  const fs = {}; for (const f of flightStats)  fs[f._id] = f.count;
  const rev = revenueStats[0] || { total: 0, currency: 'USD' };
  const usr = userStats[0]    || { total: 0, active: 0 };

  return {
    bookings:  { confirmed: bs.confirmed||0, pending: bs.pending||0, cancelled: bs.cancelled||0, total: Object.values(bs).reduce((a,b)=>a+b,0) },
    revenue:   { total: rev.total, currency: rev.currency },
    users:     usr,
    flights:   { scheduled: fs.scheduled||0, delayed: fs.delayed||0, cancelled: fs.cancelled||0 },
    topRoutes: topRoutes.map(r => ({ origin: r._id.origin, destination: r._id.dest, bookings: r.bookings, revenue: r.revenue })),
    recentBookings,
  };
}

async function listFlights({ page=1, limit=20, status, origin, date } = {}) {
  const q = {};
  if (status) q.status = status;
  if (origin) q.originIata = origin.toUpperCase();
  if (date)   { const d = new Date(date); q.departureTime = { $gte: d, $lte: new Date(d.getTime()+86400000) }; }
  const [flights, total] = await Promise.all([
    Flight.find(q).sort({ departureTime: 1 }).skip((page-1)*limit).limit(limit).lean(),
    Flight.countDocuments(q),
  ]);
  return { flights, total, page: parseInt(page), limit };
}

async function createFlight(data) {
  const flight = await Flight.create({
    flightNumber:     data.flightNumber,
    originIata:       String(data.origin || '').toUpperCase(),
    destIata:         String(data.destination || '').toUpperCase(),
    departureTime:    new Date(data.departureTime),
    arrivalTime:      new Date(data.arrivalTime),
    durationMin:      data.durationMin || Math.round((new Date(data.arrivalTime)-new Date(data.departureTime))/60000),
    departureTerminal:data.departureTerminal,
    arrivalTerminal:  data.arrivalTerminal,
    aircraftType:     data.aircraftType,
    economyAvailable: parseInt(data.economyAvailable || 150),
    businessAvailable:parseInt(data.businessAvailable || 20),
    premiumAvailable: parseInt(data.premiumAvailable || 20),
    firstAvailable:   parseInt(data.firstAvailable || 8),
    fares: [
      { cabinClass:'economy',         basePrice: data.economyPrice || 200,  taxAmount:45, fuelSurcharge:25, serviceFee:15, seatsAvailable:parseInt(data.economyAvailable||150), seatsTotal:parseInt(data.economyAvailable||150), fareCode:'Y', refundable:false, changeable:false, milesEarned:500 },
      { cabinClass:'business',        basePrice: data.businessPrice || 1500, taxAmount:180,fuelSurcharge:100,serviceFee:15, seatsAvailable:parseInt(data.businessAvailable||20),seatsTotal:parseInt(data.businessAvailable||20), fareCode:'J', refundable:true, changeable:true, milesEarned:3000 },
      { cabinClass:'premium_economy', basePrice: data.premiumPrice || 600,  taxAmount:90, fuelSurcharge:50, serviceFee:15, seatsAvailable:parseInt(data.premiumAvailable||20), seatsTotal:parseInt(data.premiumAvailable||20), fareCode:'W', refundable:true, changeable:true, milesEarned:1200 },
      { cabinClass:'first',           basePrice: data.firstPrice || 4000,   taxAmount:280,fuelSurcharge:150,serviceFee:15, seatsAvailable:parseInt(data.firstAvailable||8),  seatsTotal:parseInt(data.firstAvailable||8), fareCode:'F', refundable:true, changeable:true, milesEarned:6000 },
    ],
  });
  await cache.clearPrefix('search:');
  await cache.clearPrefix('flight:');
  return flight;
}

async function updateFlight(flightId, data) {
  const allowed = { status:1, delayMinutes:1, delayReason:1, departureGate:1, arrivalGate:1, departureTerminal:1, arrivalTerminal:1, cancellationReason:1 };
  const update = {};
  for (const [k, v] of Object.entries(data)) if (allowed[k]) update[k] = v;
  const flight = await Flight.findByIdAndUpdate(flightId, update, { new: true });
  if (!flight) throw Object.assign(new Error('Flight not found'), { status: 404 });
  await cache.clearPrefix('search:');
  await cache.clearPrefix('flight:');
  return flight;
}

async function deleteFlight(flightId) {
  const count = await Booking.countDocuments({ 'flights.flight': flightId, status: { $in: ['pending','confirmed'] } });
  if (count > 0) throw Object.assign(new Error('Cannot delete flight with active bookings'), { status: 409 });
  await Flight.findByIdAndDelete(flightId);
  await cache.clearPrefix('search:');
  await cache.clearPrefix('flight:');
  return { deleted: true };
}

async function listUsers({ page=1, limit=20, role, status, search } = {}) {
  const q = { deletedAt: null };
  if (role)   q.role   = role;
  if (status) q.status = status;
  if (search) q.$or = [{ email: new RegExp(search,'i') }, { firstName: new RegExp(search,'i') }, { lastName: new RegExp(search,'i') }];
  const [users, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).select('-passwordHash -twoFaSecret').lean(),
    User.countDocuments(q),
  ]);
  return { users, total, page: parseInt(page), limit };
}

async function updateUserStatus(userId, status, adminId) {
  if (!['active','inactive','suspended'].includes(status)) throw Object.assign(new Error('Invalid status'), { status: 400 });
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select('email status');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

async function updateUserRole(userId, role, adminId) {
  const allowed = ['customer', 'agent', 'admin', 'superadmin'];
  if (!allowed.includes(role)) throw Object.assign(new Error('Invalid role'), { status: 400 });
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('email role');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

async function listAllBookings({ page=1, limit=20, status, search } = {}) {
  const q = {};
  if (status) q.status = status;
  if (search) q.$or = [{ bookingRef: new RegExp(search,'i') }, { contactEmail: new RegExp(search,'i') }];
  const [bookings, total] = await Promise.all([
    Booking.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).populate('user','email').lean(),
    Booking.countDocuments(q),
  ]);
  return { bookings, total, page: parseInt(page), limit };
}

/** Alias for routes expecting listBookings */
async function listBookings(query) {
  return listAllBookings(query);
}

async function getRouteReport() {
  return Booking.aggregate([
    { $match: { status: 'confirmed', createdAt: { $gte: new Date(Date.now() - 90 * 86400000) } } },
    { $unwind: '$flights' },
    { $group: { _id: { origin: '$flights.originIata', dest: '$flights.destIata' }, bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { bookings: -1 } },
  ]);
}

async function getRevenueReport({ from, to, groupBy = 'day' } = {}) {
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30*86400000);
  const dateTo   = to   ? new Date(to)   : new Date();
  const fmt = { day: '%Y-%m-%d', week: '%Y-%U', month: '%Y-%m' }[groupBy] || '%Y-%m-%d';
  return Booking.aggregate([
    { $match: { createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'confirmed' } },
    { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 }, avgValue: { $avg: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);
}

async function createPromo(data, adminId) {
  return PromoCode.create({ ...data, code: data.code.toUpperCase(), createdBy: adminId });
}

async function listPromos() {
  return PromoCode.find().sort({ createdAt: -1 }).lean();
}

async function getSettings() {
  const rows = await Setting.find().lean();
  return rows.reduce((acc, r) => ({ ...acc, [r.key]: { value: r.value, description: r.description } }), {});
}

async function updateSetting(key, value, adminId) {
  return Setting.findOneAndUpdate({ key }, { value: String(value), updatedBy: adminId }, { upsert: true, new: true });
}

module.exports = {
  getDashboardStats, listFlights, createFlight, updateFlight, deleteFlight, listUsers,
  updateUserStatus, updateUserRole, listAllBookings, listBookings, getRouteReport,
  getRevenueReport, createPromo, listPromos, getSettings, updateSetting,
};
