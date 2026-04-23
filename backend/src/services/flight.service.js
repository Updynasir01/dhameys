// src/services/flight.service.js — Provider-backed (MongoDB / Mystifly)
const Flight  = require('../models/Flight');
const Airport = require('../models/Airport');
const { cache } = require('../config/database');
const logger = require('../utils/logger');
const { isMystiflyEnabled } = require('../providers/provider.factory');
const mystifly = require('../providers/mystifly/mystifly.service');

/** UTC day for YYYY-MM-DD, expanded ±20h so local `datetime-local` departures still match the same calendar search date */
function departureInstantRange(departureDate) {
  const dayStart = new Date(departureDate + 'T00:00:00.000Z');
  const dayEnd = new Date(departureDate + 'T23:59:59.999Z');
  const slack = 20 * 3600000;
  return { $gte: new Date(dayStart.getTime() - slack), $lte: new Date(dayEnd.getTime() + slack) };
}

async function mongoSearch({ origin, destination, departureDate, cabinClass = 'economy', adults = 1, children = 0, sortBy = 'price', page = 1, size = 20 }) {
  const cacheKey = `search:${origin}:${destination}:${departureDate}:${cabinClass}:${adults}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const departureTime = departureInstantRange(departureDate);
  const totalPax = parseInt(adults, 10) + parseInt(children || 0, 10);

  const query = {
    originIata: origin.toUpperCase(),
    destIata:   destination.toUpperCase(),
    departureTime,
    status: { $in: ['scheduled', 'delayed'] },
    [`${cabinClass}Available`]: { $gte: totalPax },
    'fares': { $elemMatch: { cabinClass, isActive: true, seatsAvailable: { $gte: totalPax } } },
  };

  const sortMap = { price: { 'fares.basePrice': 1 }, duration: { durationMin: 1 }, departure: { departureTime: 1 } };
  const sort = sortMap[sortBy] || sortMap.price;

  const [flights, total] = await Promise.all([
    Flight.find(query).sort(sort).skip((page-1)*size).limit(size).lean(),
    Flight.countDocuments(query),
  ]);

  // Add totalPrice virtual to each fare
  const withPrices = flights.map(f => ({
    ...f,
    fares: (f.fares || []).map(fare => ({
      ...fare,
      totalPrice: fare.basePrice + fare.taxAmount + fare.fuelSurcharge + fare.serviceFee,
    })),
  }));

  const result = { flights: withPrices, total, page: parseInt(page), size };
  await cache.set(cacheKey, result, 300);
  return result;
}

async function search(params) {
  if (isMystiflyEnabled()) {
    return mystifly.search(params);
  }
  return mongoSearch(params);
}

async function getFlightById(id) {
  const cacheKey = `flight:${id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  const flight = await Flight.findById(id).lean();
  if (!flight) throw Object.assign(new Error('Flight not found'), { status: 404 });
  const f = { ...flight, fares: (flight.fares||[]).map(fare => ({ ...fare, totalPrice: fare.basePrice + fare.taxAmount + fare.fuelSurcharge + fare.serviceFee })) };
  await cache.set(cacheKey, f, 300);
  return f;
}

async function autocomplete(q) {
  if (!q || q.length < 2) return [];
  const airports = await Airport.find({
    isActive: true,
    $or: [
      { iataCode: new RegExp('^' + q, 'i') },
      { city: new RegExp(q, 'i') },
      { name: new RegExp(q, 'i') },
    ],
  }).limit(10).select('iataCode name city country countryName').lean();
  return airports;
}

async function getSeatMap(flightId) {
  // Simplified seat map — generate from flight's available counts
  const flight = await Flight.findById(flightId).select('economyAvailable businessAvailable premiumAvailable firstAvailable aircraftType').lean();
  if (!flight) throw Object.assign(new Error('Flight not found'), { status: 404 });

  // Generate a simple seat layout
  const rows = [];
  const cabins = [
    { class: 'first',           count: 2,  letters: ['A','B','C','D'], start: 1 },
    { class: 'business',        count: 5,  letters: ['A','B','C','D','E','F'], start: 3 },
    { class: 'premium_economy', count: 5,  letters: ['A','B','C','D','E','F'], start: 8 },
    { class: 'economy',         count: 20, letters: ['A','B','C','D','E','F'], start: 13 },
  ];

  for (const cabin of cabins) {
    for (let r = 0; r < cabin.count; r++) {
      const rowNum = cabin.start + r;
      const seats = cabin.letters.map((letter, i) => ({
        seatCode: `${rowNum}${letter}`,
        letter, cabinClass: cabin.class,
        seatType: i === 0 || i === cabin.letters.length-1 ? 'window' : (i === Math.floor(cabin.letters.length/2)-1 || i === Math.floor(cabin.letters.length/2)) ? 'aisle' : 'middle',
        status:  'available',
        hasExtraLegroom: r === 0,
        isExitRow: r === 0 && cabin.class === 'economy',
      }));
      rows.push({ rowNumber: rowNum, cabinClass: cabin.class, seats });
    }
  }
  return rows;
}

async function getFareRules(flightId, fareId) {
  const flight = await Flight.findById(flightId).lean();
  if (!flight) throw Object.assign(new Error('Flight not found'), { status: 404 });
  const fare = (flight.fares || []).find((f) => String(f._id) === String(fareId));
  if (!fare) throw Object.assign(new Error('Fare not found'), { status: 404 });
  if (flight.provider !== 'mystifly') {
    throw Object.assign(new Error('Fare rules are only available for provider inventory'), { status: 501 });
  }
  return mystifly.fareRules({ flight, fare });
}

module.exports = { search, getFlightById, getSeatMap, autocomplete, getFareRules };
