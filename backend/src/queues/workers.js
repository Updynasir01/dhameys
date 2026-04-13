// src/queues/workers.js — Dhameys Queue Workers
require('dotenv').config();
const { connect, subscribe, QUEUES } = require('../config/rabbitmq');
const { connectDB } = require('../config/database');
const notificationService = require('../services/notification.service');
const ticketService = require('../services/ticket.service');
const logger = require('../utils/logger');

async function startWorkers() {
  await connectDB();
  await connect();

  // Email Worker
  await subscribe(QUEUES.EMAIL, async (job) => {
    await notificationService.processEmailJob(job);
  });

  // Booking Worker
  await subscribe(QUEUES.BOOKING, async (job) => {
    const { pgQuery } = require('../config/database');
    if (job.type === 'BOOKING_CONFIRM') {
      const { rows } = await pgQuery(
        `SELECT b.*, u.email, u.first_name FROM bookings b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = $1`,
        [job.bookingId]
      );
      if (rows[0]?.email) {
        const { rows: passengers } = await pgQuery('SELECT * FROM passengers WHERE booking_id = $1', [job.bookingId]);
        const { rows: flights } = await pgQuery(
          `SELECT f.flight_number, f.departure_time, bf.cabin_class,
                  oa.iata_code AS origin_iata, da.iata_code AS dest_iata
           FROM booking_flights bf JOIN flights f ON f.id = bf.flight_id
           JOIN routes r ON r.id = f.route_id JOIN airports oa ON oa.id = r.origin_id JOIN airports da ON da.id = r.destination_id
           WHERE bf.booking_id = $1`, [job.bookingId]
        );
        await notificationService.processEmailJob({ type: 'BOOKING_CONFIRMATION', to: rows[0].email, booking: rows[0], passengers, flights });
      }
    }
    if (job.type === 'BOOKING_CANCEL') {
      const { rows } = await pgQuery(`SELECT b.booking_ref, u.email FROM bookings b LEFT JOIN users u ON u.id = b.user_id WHERE b.id = $1`, [job.bookingId]);
      if (rows[0]?.email) await notificationService.sendEmail({ to: rows[0].email, subject: `Booking ${rows[0].booking_ref} Cancelled`, htmlContent: `<p>Your booking <strong>${rows[0].booking_ref}</strong> has been cancelled.</p>` });
    }
  });

  // Payment Worker
  await subscribe(QUEUES.PAYMENT, async (job) => {
    const { pgQuery } = require('../config/database');
    if (job.type === 'PAYMENT_SUCCESS') {
      const { rows } = await pgQuery(`SELECT b.booking_ref, p.amount, p.currency, u.email FROM payments p JOIN bookings b ON b.id = p.booking_id LEFT JOIN users u ON u.id = b.user_id WHERE p.id = $1`, [job.paymentId]);
      if (rows[0]?.email) await notificationService.sendEmail({ to: rows[0].email, subject: `Payment Confirmed — ${rows[0].booking_ref}`, htmlContent: `<p>Payment of ${rows[0].currency} ${rows[0].amount} confirmed.</p>` });
    }
    if (job.type === 'REFUND_INITIATED') {
      const { rows } = await pgQuery(`SELECT b.booking_ref, b.contact_email FROM bookings b WHERE b.id = $1`, [job.bookingId]);
      if (rows[0]) await notificationService.sendEmail({ to: rows[0].contact_email, subject: `Refund Initiated — ${rows[0].booking_ref}`, htmlContent: `<p>Your refund of ${job.amount} for booking ${rows[0].booking_ref} has been initiated.</p>` });
    }
  });

  // Ticket Worker
  await subscribe(QUEUES.TICKET, async (job) => {
    if (job.type === 'GENERATE_TICKET') await ticketService.generateTicketsForBooking(job.bookingId);
  });

  logger.info('[Workers] All workers listening');
  console.log('\n🔧 Dhameys Queue Workers running\n');
}

startWorkers().catch(err => { logger.error('Worker startup failed:', err); process.exit(1); });
