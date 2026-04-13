// src/config/rabbitmq.js — RabbitMQ (optional, app works without it)
let amqp = null;
try { amqp = require('amqplib'); } catch (_) {}

let channel = null;
const QUEUES = { BOOKING:'booking_queue', EMAIL:'email_queue', PAYMENT:'payment_queue', TICKET:'ticket_queue', NOTIFICATION:'notification_queue' };

async function connect() {
  if (!amqp || !process.env.RABBITMQ_URL) { console.log('[RabbitMQ] Skipped (RABBITMQ_URL not set)'); return null; }
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    channel    = await conn.createChannel();
    for (const q of Object.values(QUEUES)) await channel.assertQueue(q, { durable: true });
    console.log('[RabbitMQ] Connected (run `npm run workers` in another terminal so queued emails are sent)');
    return channel;
  } catch (err) {
    console.warn('[RabbitMQ] Could not connect (optional):', err.message);
    return null;
  }
}

async function publish(queue, message) {
  if (!channel) return false;
  try { return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true }); } catch { return false; }
}

async function subscribe(queue, handler) {
  if (!channel) return;
  channel.consume(queue, async (msg) => {
    if (!msg) return;
    try { await handler(JSON.parse(msg.content.toString())); channel.ack(msg); }
    catch (err) { console.error(`[RabbitMQ] Handler error on '${queue}':`, err.message); channel.nack(msg, false, true); }
  });
}

// Queue helper objects — silently no-op if RabbitMQ is not available
const make = (type) => ({
  publishConfirm:         (d) => publish(QUEUES.BOOKING,  { type:'BOOKING_CONFIRM',      ...d }),
  publishCancel:          (d) => publish(QUEUES.BOOKING,  { type:'BOOKING_CANCEL',       ...d }),
  publishSuccess:         (d) => publish(QUEUES.PAYMENT,  { type:'PAYMENT_SUCCESS',      ...d }),
  publishFailed:          (d) => publish(QUEUES.PAYMENT,  { type:'PAYMENT_FAILED',       ...d }),
  publishRefund:          (d) => publish(QUEUES.PAYMENT,  { type:'REFUND_INITIATED',     ...d }),
  sendVerification:       (d) => publish(QUEUES.EMAIL,    { type:'EMAIL_VERIFICATION',   ...d }),
  sendPasswordReset:      (d) => publish(QUEUES.EMAIL,    { type:'PASSWORD_RESET',       ...d }),
  sendBookingConfirmation:(d) => publish(QUEUES.EMAIL,    { type:'BOOKING_CONFIRMATION', ...d }),
  sendTicket:             (d) => publish(QUEUES.EMAIL,    { type:'TICKET_ISSUED',        ...d }),
  sendFlightAlert:        (d) => publish(QUEUES.EMAIL,    { type:'FLIGHT_ALERT',         ...d }),
  generate:               (d) => publish(QUEUES.TICKET,   { type:'GENERATE_TICKET',      ...d }),
});

const BookingQueue = make(); const EmailQueue = make(); const PaymentQueue = make(); const TicketQueue = make();

// Send auth emails: queue if RabbitMQ is up, otherwise send immediately (so dev works without workers)
const notificationService = require('../services/notification.service');
EmailQueue.sendVerification = async (d) => {
  const job = { type: 'EMAIL_VERIFICATION', ...d };
  const ok = await publish(QUEUES.EMAIL, job);
  if (!ok) {
    try {
      await notificationService.processEmailJob(job);
    } catch (err) {
      console.warn('[EmailQueue] Verification email failed:', err.message);
    }
  }
};
EmailQueue.sendPasswordReset = async (d) => {
  const job = { type: 'PASSWORD_RESET', ...d };
  const ok = await publish(QUEUES.EMAIL, job);
  if (!ok) {
    try {
      await notificationService.processEmailJob(job);
    } catch (err) {
      console.warn('[EmailQueue] Password reset email failed:', err.message);
    }
  }
};

module.exports = { connect, publish, subscribe, QUEUES, BookingQueue, EmailQueue, PaymentQueue, TicketQueue };
