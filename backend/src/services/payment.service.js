// src/services/payment.service.js — MongoDB version
const Stripe  = require('stripe');
const crypto  = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User    = require('../models/User');
const bookingService = require('./booking.service');
const { PaymentQueue } = require('../config/rabbitmq');
const logger = require('../utils/logger');

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey && !stripeKey.includes('placeholder') && !stripeKey.includes('your_')
  ? new Stripe(stripeKey, { apiVersion: '2023-10-16' })
  : null;

function isTestPaymentMode() {
  if (process.env.PAYMENT_TEST_MODE === 'true') return true;
  if (process.env.PAYMENT_TEST_MODE === 'false') return false;
  if (!stripeKey || stripeKey.includes('placeholder') || stripeKey.includes('your_')) return true;
  return false;
}

async function createPaymentIntent(bookingId, userId) {
  const booking = await Booking.findOne({ _id: bookingId, status: 'pending' });
  if (!booking) throw Object.assign(new Error('Booking not found or not pending'), { status: 404 });

  if (isTestPaymentMode()) {
    const paymentRef = 'DHP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const testIntentId = 'test_pi_' + paymentRef;
    await Payment.create({
      paymentRef,
      booking: booking._id,
      user: userId || null,
      amount: booking.totalAmount,
      currency: booking.currency || 'USD',
      status: 'pending',
      method: 'test',
      stripePaymentIntentId: testIntentId,
    });
    return {
      clientSecret: null,
      paymentIntentId: testIntentId,
      amount: booking.totalAmount,
      currency: booking.currency || 'USD',
      testMode: true,
    };
  }

  if (!stripe) throw Object.assign(new Error('Stripe is not configured'), { status: 503 });

  let stripeCustomerId;
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      const cList = await stripe.customers.list({ email: user.email, limit: 1 }).catch(()=>({ data: [] }));
      stripeCustomerId = cList.data.length ? cList.data[0].id : (await stripe.customers.create({ email: user.email, metadata: { userId } }).catch(()=>null))?.id;
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount:   Math.round(booking.totalAmount * 100),
    currency: (booking.currency || 'USD').toLowerCase(),
    customer: stripeCustomerId || undefined,
    metadata: { bookingId: booking._id.toString(), bookingRef: booking.bookingRef },
    automatic_payment_methods: { enabled: true },
    description: `Dhameys Airlines — ${booking.bookingRef}`,
  });

  const paymentRef = 'DHP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  await Payment.create({ paymentRef, booking: booking._id, user: userId||null, amount: booking.totalAmount, currency: booking.currency, status: 'pending', method: 'stripe', stripePaymentIntentId: intent.id, stripeCustomerId: stripeCustomerId||null });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: booking.totalAmount,
    currency: booking.currency,
    testMode: false,
  };
}

async function confirmPayment(paymentIntentId) {
  if (paymentIntentId && String(paymentIntentId).startsWith('test_pi_')) {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) throw Object.assign(new Error('Payment record not found'), { status: 404 });
    if (payment.status === 'completed') return payment;

    await Payment.findByIdAndUpdate(payment._id, {
      status: 'completed',
      paidAt: new Date(),
    });
    await bookingService.confirmBooking(payment.booking);
    await PaymentQueue.publishSuccess({ paymentId: payment._id, bookingId: payment.booking }).catch(() => {});
    return payment;
  }

  if (!stripe) throw Object.assign(new Error('Stripe is not configured'), { status: 503 });

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId).catch(()=>null);
  if (!intent || intent.status !== 'succeeded')
    throw Object.assign(new Error(`Payment not succeeded`), { status: 400 });

  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!payment) throw Object.assign(new Error('Payment record not found'), { status: 404 });
  if (payment.status === 'completed') return payment;

  const fraudScore = intent.charges?.data?.[0]?.outcome?.risk_score || 0;
  const isFlagged  = fraudScore > 75;

  const pm = intent.payment_method ? await stripe.paymentMethods.retrieve(intent.payment_method).catch(()=>null) : null;

  await Payment.findByIdAndUpdate(payment._id, {
    status:       isFlagged ? 'processing' : 'completed',
    paidAt:       new Date(),
    stripeChargeId: intent.latest_charge,
    cardLast4:    pm?.card?.last4 || null,
    cardBrand:    pm?.card?.brand || null,
    cardExpMonth: pm?.card?.exp_month || null,
    cardExpYear:  pm?.card?.exp_year  || null,
    fraudScore, isFlagged,
  });

  if (!isFlagged) {
    await bookingService.confirmBooking(payment.booking);
    await PaymentQueue.publishSuccess({ paymentId: payment._id, bookingId: payment.booking }).catch(()=>{});
  }

  return payment;
}

async function handleWebhook(rawBody, signature) {
  if (!stripe) throw Object.assign(new Error('Stripe not configured'), { status: 503 });
  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type === 'payment_intent.succeeded') await confirmPayment(event.data.object.id);
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await Payment.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { status: 'failed', failedAt: new Date(), failureReason: pi.last_payment_error?.message });
  }
  return { received: true };
}

async function createRefund(bookingRef, userId, reason) {
  const booking = await Booking.findOne(userId ? { bookingRef, user: userId } : { bookingRef });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  const payment = await Payment.findOne({ booking: booking._id, status: 'completed' });
  if (!payment) throw Object.assign(new Error('No completed payment found'), { status: 404 });

  if (payment.method === 'test' || String(payment.stripePaymentIntentId || '').startsWith('test_pi_')) {
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'refunded',
      refundAmount: payment.amount,
      refundReason: reason,
      refundedAt: new Date(),
    });
    await Booking.findByIdAndUpdate(booking._id, { status: 'refunded' });
    await PaymentQueue.publishRefund({ bookingId: booking._id, amount: payment.amount }).catch(() => {});
    return { refunded: true, amount: payment.amount, currency: payment.currency };
  }

  if (!stripe) throw Object.assign(new Error('Stripe is not configured'), { status: 503 });

  const refund = await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId, reason: 'requested_by_customer' });
  await Payment.findByIdAndUpdate(payment._id, { status: 'refunded', refundAmount: payment.amount, refundReason: reason, refundedAt: new Date(), stripeRefundId: refund.id });
  await Booking.findByIdAndUpdate(booking._id, { status: 'refunded' });
  await PaymentQueue.publishRefund({ bookingId: booking._id, amount: payment.amount }).catch(()=>{});
  return { refunded: true, amount: payment.amount, currency: payment.currency };
}

module.exports = { createPaymentIntent, confirmPayment, handleWebhook, createRefund, isTestPaymentMode };
