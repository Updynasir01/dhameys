const Flight = require('../../models/Flight');
const Booking = require('../../models/Booking');
const logger = require('../../utils/logger');
const MystiflyClient = require('./mystifly.client');
const { mapSearchToFlightOptions, mapFareRulesResponse } = require('./mystifly.mapper');

function providerFareMatch(existingFare, incomingFare) {
  const a = String(existingFare.providerFareId || existingFare.fareCode || '');
  const b = String(incomingFare.providerFareId || incomingFare.fareCode || '');
  return a && b && a === b;
}

async function upsertFlightOption(opt) {
  // Use providerFlightId as stable identity
  const existing = await Flight.findOne({ provider: 'mystifly', providerFlightId: opt.providerFlightId });
  if (!existing) {
    const created = await Flight.create(opt);
    return created.toObject();
  }

  // Update top-level fields
  const updatable = [
    'flightNumber',
    'originIata','originCity','originName',
    'destIata','destCity','destName',
    'departureTime','arrivalTime',
    'durationMin',
    'status',
    'aircraftType',
    'checkedBaggageKg','cabinBaggageKg',
    'providerMeta',
  ];
  for (const k of updatable) existing[k] = opt[k];

  // Merge fares so existing subdoc _ids remain stable for already-seen provider fares
  const incomingFares = Array.isArray(opt.fares) ? opt.fares : [];
  for (const inc of incomingFares) {
    const match = existing.fares.find((f) => providerFareMatch(f, inc));
    if (match) {
      Object.assign(match, inc);
    } else {
      existing.fares.push(inc);
    }
  }

  await existing.save();
  return existing.toObject();
}

async function search(query) {
  const client = new MystiflyClient();
  const payload = {
    origin: query.origin,
    destination: query.destination,
    departureDate: query.departureDate,
    cabinClass: query.cabinClass || 'economy',
    adults: query.adults || 1,
    children: query.children || 0,
    infants: query.infants || 0,
  };

  const raw = await client.searchFlights(payload);
  const options = mapSearchToFlightOptions(raw, query);

  const persisted = [];
  for (const opt of options) {
    persisted.push(await upsertFlightOption(opt));
  }

  // Basic sort/paging on persisted results
  const sortBy = query.sortBy || 'price';
  const page = parseInt(query.page || '1', 10);
  const size = parseInt(query.size || '20', 10);

  const sorted = persisted.sort((a, b) => {
    if (sortBy === 'departure') return new Date(a.departureTime) - new Date(b.departureTime);
    if (sortBy === 'duration') return (a.durationMin || 0) - (b.durationMin || 0);
    // price: sort by first fare's total price
    const ap = (a.fares?.[0]?.basePrice || 0) + (a.fares?.[0]?.taxAmount || 0) + (a.fares?.[0]?.fuelSurcharge || 0) + (a.fares?.[0]?.serviceFee || 0);
    const bp = (b.fares?.[0]?.basePrice || 0) + (b.fares?.[0]?.taxAmount || 0) + (b.fares?.[0]?.fuelSurcharge || 0) + (b.fares?.[0]?.serviceFee || 0);
    return ap - bp;
  });

  const start = (page - 1) * size;
  const paged = sorted.slice(start, start + size);

  return { flights: paged, total: sorted.length, page, size };
}

async function fareRules({ flight, fare }) {
  const client = new MystiflyClient();
  const payload = {
    providerFlightId: flight.providerFlightId,
    providerFareId: fare.providerFareId || fare.fareCode,
    cabinClass: fare.cabinClass,
    currency: fare.currency,
    providerMeta: { flight: flight.providerMeta, fare: fare.providerMeta },
  };
  const raw = await client.fetchFareRules(payload);
  return mapFareRulesResponse(raw);
}

async function createExternalBookingHold({ booking, flight, fare }) {
  const client = new MystiflyClient();
  const payload = {
    providerFlightId: flight.providerFlightId,
    providerFareId: fare.providerFareId || fare.fareCode,
    cabinClass: booking.flights?.[0]?.cabinClass,
    passengers: booking.passengers,
    contactEmail: booking.contactEmail,
    contactPhone: booking.contactPhone,
    currency: booking.currency,
    totalAmount: booking.totalAmount,
    providerMeta: { flight: flight.providerMeta, fare: fare.providerMeta },
  };

  const raw = await client.createBooking(payload);
  // We don't know exact response yet, so keep it flexible.
  const providerBookingRef = raw?.bookingRef || raw?.BookingRef || raw?.Data?.BookingRef || raw?.Reference || null;
  const providerPnr = raw?.pnr || raw?.PNR || raw?.Data?.PNR || null;

  return { providerBookingRef, providerPnr, raw };
}

async function onBookingConfirmed(bookingId) {
  // Hook point: after Stripe confirm, you may need to ticket/confirm with Mystifly.
  const booking = await Booking.findById(bookingId).populate('flights.flight').lean();
  if (!booking) return;
  if (booking.provider !== 'mystifly') return;
  logger.info('Mystifly booking confirmed (post-payment hook placeholder)', { bookingRef: booking.bookingRef, providerBookingRef: booking.providerBookingRef });
}

module.exports = { search, fareRules, createExternalBookingHold, onBookingConfirmed };

