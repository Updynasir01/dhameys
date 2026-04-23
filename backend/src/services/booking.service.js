// src/services/booking.service.js — MongoDB version
const crypto  = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Flight  = require('../models/Flight');
const { PromoCode, PromoUsage, LoyaltyTransaction, Addon } = require('../models/index');
const { cache } = require('../config/database');
const { BookingQueue, TicketQueue } = require('../config/rabbitmq');
const ticketService = require('./ticket.service');
const logger  = require('../utils/logger');
const mystifly = require('../providers/mystifly/mystifly.service');

async function generateBookingRef() {
  for (let i = 0; i < 10; i++) {
    const ref = 'DH' + crypto.randomBytes(3).toString('hex').toUpperCase();
    if (!(await Booking.findOne({ bookingRef: ref }))) return ref;
  }
  throw new Error('Could not generate unique booking ref');
}

async function createBooking(data, userId) {
  const {
    tripType, outboundFlightId, returnFlightId, cabinClass, fareRuleId,
    passengers, seatAssignments = [], addons = [],
    contactEmail, contactPhone, promoCode, loyaltyPointsToUse = 0,
  } = data;

  // Validate flight and fare
  const flight = await Flight.findById(outboundFlightId);
  if (!flight) throw Object.assign(new Error('Flight not found'), { status: 404 });
  const fare = flight.fares.id(fareRuleId);
  if (!fare || !fare.isActive || fare.seatsAvailable < passengers.length)
    throw Object.assign(new Error('Fare no longer available'), { status: 409 });

  // Check seat locks (only for local inventory)
  if (flight.provider !== 'mystifly') {
    for (const sa of seatAssignments) {
      if (await cache.isSeatLocked(sa.flightId || outboundFlightId, sa.seatCode))
        throw Object.assign(new Error(`Seat ${sa.seatCode} is already held`), { status: 409 });
    }
  }

  // Promo
  let promoDiscount = 0, promoDoc = null;
  if (promoCode) {
    promoDoc = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true, $or: [{ validFrom: null }, { validFrom: { $lte: new Date() } }], $or: [{ validTo: null }, { validTo: { $gte: new Date() } }] });
    if (promoDoc && promoDoc.usedCount < (promoDoc.maxUses || Infinity)) {
      const sub = fare.basePrice * passengers.length;
      promoDiscount = promoDoc.discountType === 'percentage'
        ? Math.min(sub * promoDoc.discountValue / 100, promoDoc.maxDiscount || Infinity)
        : Math.min(promoDoc.discountValue, promoDoc.maxDiscount || Infinity);
    }
  }

  // Add-ons
  let addonTotal = 0;
  const addonItems = [];
  for (const a of addons) {
    const addonDoc = await Addon.findById(a.addonId);
    if (addonDoc?.isActive) {
      addonTotal += addonDoc.price * (a.quantity || 1);
      addonItems.push({ addonId: addonDoc._id, name: addonDoc.name, type: addonDoc.type, quantity: a.quantity || 1, unitPrice: addonDoc.price, totalPrice: addonDoc.price * (a.quantity || 1) });
    }
  }

  // Pricing
  const subtotal      = fare.basePrice * passengers.length;
  const taxTotal      = (fare.taxAmount + fare.fuelSurcharge + fare.serviceFee) * passengers.length;
  const discountTotal = promoDiscount;
  const totalAmount   = Math.max(subtotal + taxTotal + addonTotal - discountTotal, 0);

  // Build flight segments
  const flightSegments = [
    {
      flight: flight._id,
      flightNumber: flight.flightNumber,
      originIata: flight.originIata,
      destIata: flight.destIata,
      departureTime: flight.departureTime,
      cabinClass,
      fareId: fare._id,
      provider: flight.provider || 'mongo',
      providerFlightId: flight.providerFlightId,
      providerFareId: fare.providerFareId || fare.fareCode,
      segmentOrder: 1,
    },
  ];
  if (returnFlightId) {
    const ret = await Flight.findById(returnFlightId);
    if (ret) flightSegments.push({
      flight: ret._id,
      flightNumber: ret.flightNumber,
      originIata: ret.originIata,
      destIata: ret.destIata,
      departureTime: ret.departureTime,
      cabinClass,
      provider: ret.provider || 'mongo',
      providerFlightId: ret.providerFlightId,
      segmentOrder: 2,
    });
  }

  // Assign seats to passengers
  const paxWithSeats = passengers.map((p, i) => {
    const sa = seatAssignments.find(s => s.passengerIndex === i);
    return { ...p, seatCode: sa?.seatCode || null };
  });

  const bookingRef  = await generateBookingRef();
  const expiresAt   = new Date(Date.now() + parseInt(process.env.SEAT_HOLD_MINUTES || '15') * 60000);

  const booking = await Booking.create({
    bookingRef, user: userId || null, tripType, status: 'pending',
    flights: flightSegments, passengers: paxWithSeats, addons: addonItems,
    subtotal, taxTotal, addonTotal, discountTotal, totalAmount,
    currency: fare.currency || 'USD',
    promoCode: promoCode || undefined, promoDiscount,
    loyaltyPointsUsed: loyaltyPointsToUse,
    contactEmail: contactEmail.toLowerCase(), contactPhone: contactPhone || undefined,
    expiresAt,
    provider: flight.provider || 'mongo',
  });

  if (flight.provider !== 'mystifly') {
    // Deduct fare seats
    await Flight.findOneAndUpdate(
      { _id: outboundFlightId, 'fares._id': fare._id },
      { $inc: { 'fares.$.seatsAvailable': -passengers.length, [`${cabinClass}Available`]: -passengers.length } }
    );

    // Lock seats in cache
    for (const sa of seatAssignments) {
      await cache.lockSeat(sa.flightId || outboundFlightId, sa.seatCode, bookingRef, 15);
    }
  } else {
    // External provider hold/booking creation (pre-payment) so we can revalidate inventory.
    const { providerBookingRef, providerPnr } = await mystifly.createExternalBookingHold({ booking, flight: flight.toObject(), fare: fare.toObject() });
    await Booking.findByIdAndUpdate(booking._id, { providerBookingRef, providerPnr });
  }

  // Update promo usage
  if (promoDoc && promoDiscount > 0) {
    await PromoCode.findByIdAndUpdate(promoDoc._id, { $inc: { usedCount: 1 } });
    if (userId) await PromoUsage.create({ promo: promoDoc._id, user: userId, booking: booking._id, discount: promoDiscount });
  }

  await BookingQueue.publishConfirm({ bookingId: booking._id, bookingRef }).catch(()=>{});
  logger.info('Booking created', { bookingRef, userId, total: totalAmount });
  return booking;
}

async function confirmBooking(bookingId) {
  const booking = await Booking.findByIdAndUpdate(
    bookingId, { status: 'confirmed', confirmedAt: new Date() }, { new: true }
  );
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  // Unlock seats (only local inventory)
  if (booking.provider !== 'mystifly') {
    for (const seg of booking.flights) {
      for (const pax of booking.passengers) {
        if (pax.seatCode) await cache.unlockSeat(seg.flight, pax.seatCode);
      }
    }
  } else {
    await mystifly.onBookingConfirmed(booking._id).catch(() => {});
  }

  // Award loyalty
  if (booking.user) {
    const EARN = 10;
    const pts  = Math.floor(booking.totalAmount * EARN);
    if (pts > 0) {
      const user = await require('../models/User').findByIdAndUpdate(
        booking.user, { $inc: { loyaltyPoints: pts } }, { new: true }
      );
      await LoyaltyTransaction.create({ user: booking.user, booking: booking._id, type: 'earned', points: pts, balanceAfter: user.loyaltyPoints, description: 'Points earned for booking' });
    }
  }

  const queued = await TicketQueue.generate({ bookingId: booking._id, bookingRef: booking.bookingRef });
  if (!queued) {
    await ticketService.generateTicketsForBooking(booking._id).catch((err) =>
      logger.error('Ticket generation (inline, no queue)', err)
    );
  }
  return booking;
}

async function cancelBooking(bookingRef, userId, reason) {
  const q = userId ? { bookingRef, user: userId } : { bookingRef };
  const booking = await Booking.findOne(q);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (['cancelled','refunded'].includes(booking.status)) throw Object.assign(new Error('Already cancelled'), { status: 400 });

  await Booking.findByIdAndUpdate(booking._id, { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason || null });
  for (const seg of booking.flights) {
    for (const pax of booking.passengers) {
      if (pax.seatCode) await cache.unlockSeat(seg.flight, pax.seatCode);
    }
  }
  await BookingQueue.publishCancel({ bookingId: booking._id }).catch(()=>{});
  return booking;
}

async function getBooking(bookingRef, userId) {
  const q = userId ? { bookingRef, user: userId } : { bookingRef };
  const booking = await Booking.findOne(q).populate('flights.flight', 'flightNumber departureTime arrivalTime status originIata destIata').lean();
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  return booking;
}

module.exports = { createBooking, confirmBooking, cancelBooking, getBooking };
