// src/services/ticket.service.js — MongoDB version
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const crypto      = require('crypto');
const path        = require('path');
const fs          = require('fs');
const Ticket      = require('../models/Ticket');
const Booking     = require('../models/Booking');
const notificationService = require('./notification.service');
const logger      = require('../utils/logger');

const TICKETS_DIR = path.join(process.cwd(), 'uploads', 'tickets');
if (!fs.existsSync(TICKETS_DIR)) fs.mkdirSync(TICKETS_DIR, { recursive: true });

async function generateTicketsForBooking(bookingId) {
  const booking = await Booking.findById(bookingId).populate('flights.flight').lean();
  if (!booking) throw new Error('Booking not found');

  const tickets = [];
  const pdfAttachments = [];
  for (const segment of booking.flights) {
    for (const passenger of booking.passengers) {
      const pnr     = crypto.randomBytes(3).toString('hex').toUpperCase();
      const tickNum = await generateTicketNumber();
      const qrData  = JSON.stringify({ pnr, flight: segment.flightNumber, pax: `${passenger.firstName} ${passenger.lastName}`, seat: passenger.seatCode || 'TBD' });

      const ticket = await Ticket.create({
        ticketNumber:  tickNum,
        booking:       booking._id,
        bookingRef:    booking.bookingRef,
        passengerId:   passenger._id,
        passengerName: `${passenger.firstName} ${passenger.lastName}`,
        flight:        segment.flight?._id || segment.flight,
        flightNumber:  segment.flightNumber,
        originIata:    segment.originIata,
        destIata:      segment.destIata,
        departureTime: segment.departureTime,
        cabinClass:    segment.cabinClass,
        seatCode:      passenger.seatCode || null,
        pnrCode:       pnr,
        qrCodeData:    qrData,
        barcodeData:   `DH${booking.bookingRef}${segment.originIata}${segment.destIata}${passenger.firstName.slice(0,6).toUpperCase()}`,
      });

      try {
        const pdfPath = await generatePDF({
          ...ticket.toObject(),
          passengerFirstName: passenger.firstName,
          passengerLastName: passenger.lastName,
        });
        const basename = path.basename(pdfPath);
        await Ticket.findByIdAndUpdate(ticket._id, {
          pdfUrl: `/uploads/tickets/${basename}`,
          pdfGeneratedAt: new Date(),
        });
        const safeName = `${String(ticket.ticketNumber).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
        pdfAttachments.push({ filename: safeName, path: pdfPath });
      } catch (err) {
        logger.warn('PDF gen failed:', err.message);
      }

      tickets.push(ticket);
    }
  }

  if (booking.contactEmail) {
    await notificationService.processEmailJob({
      type: 'BOOKING_CONFIRMATION',
      to: booking.contactEmail,
      booking,
      passengers: booking.passengers,
      flights: booking.flights,
      attachments: pdfAttachments,
    }).catch((err) => logger.warn('Confirmation email failed:', err.message));
  }

  return tickets;
}

function drawLabelValue(doc, x, y, label, value, colW) {
  doc.font('Helvetica').fontSize(7).fillColor('#8a8a8a').text(String(label).toUpperCase(), x, y, { width: colW, characterSpacing: 0.5 });
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0f172a').text(String(value), x, y + 12, { width: colW });
}

async function generatePDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const filename = `${data.pnrCode}-${data.passengerFirstName || 'PAX'}.pdf`.replace(/\s+/g, '_').toUpperCase();
      const filepath = path.join(TICKETS_DIR, filename);
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const ws = fs.createWriteStream(filepath);
      doc.pipe(ws);

      const pageW = doc.page.width;
      const m = 52;
      const contentW = pageW - m * 2;
      const gold = '#c4a574';
      const navy = '#0a1628';
      const slate = '#64748b';
      const paper = '#faf9f7';
      const line = '#e7e2dc';

      const paxName = `${data.passengerFirstName || ''} ${data.passengerLastName || ''}`.trim() || 'Passenger';
      const dep = data.departureTime ? new Date(data.departureTime) : null;
      const dateLong = dep ? dep.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
      const dateShort = dep ? dep.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
      const timeStr = dep ? dep.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
      const cabin = (data.cabinClass || 'economy').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      doc.rect(0, 0, pageW, 3).fill(gold);

      doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text('DHAMEYS', m, 44, { characterSpacing: 3 });
      doc.font('Helvetica').fontSize(7).fillColor(slate).text('AIRLINES', m + 1, 56);
      doc.font('Helvetica').fontSize(7).fillColor(slate).text('Electronic ticket · Confirmed', m, 72);

      doc.font('Helvetica').fontSize(7).fillColor(slate).text('PNR', pageW - m - 100, 44, { width: 100, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(11).fillColor(navy).text(data.pnrCode || '—', pageW - m - 100, 54, { width: 100, align: 'right' });

      doc.lineWidth(0.5).strokeColor(line);
      doc.moveTo(m, 96).lineTo(pageW - m, 96).stroke();

      const origin = data.originIata || '—';
      const dest = data.destIata || '—';
      doc.font('Helvetica-Bold').fontSize(38).fillColor(navy).text(origin, m, 118);
      doc.font('Helvetica-Bold').fontSize(38);
      const destW = doc.widthOfString(dest);
      doc.fillColor(navy).text(dest, pageW - m - destW, 118);
      doc.font('Helvetica').fontSize(22).fillColor('#94a3b8').text('→', pageW / 2 - 8, 126);

      doc.font('Helvetica').fontSize(9).fillColor(slate).text(
        `${data.flightNumber || '—'}  ·  ${dateLong}`,
        m,
        172,
        { width: contentW, align: 'center' }
      );

      const cardTop = 210;
      const cardH = 200;
      doc.roundedRect(m, cardTop, contentW, cardH, 6).fill(paper);
      doc.lineWidth(0.4).strokeColor(line);
      doc.roundedRect(m, cardTop, contentW, cardH, 6).stroke();

      doc.font('Helvetica').fontSize(7).fillColor(slate).text('PASSENGER NAME', m + 20, cardTop + 18, { characterSpacing: 0.5 });
      doc.font('Helvetica-Bold').fontSize(14).fillColor(navy).text(paxName, m + 20, cardTop + 30, { width: contentW - 40 });

      const colW = (contentW - 50) / 3;
      const row1 = cardTop + 78;
      drawLabelValue(doc, m + 20, row1, 'Flight', data.flightNumber || '—', colW);
      drawLabelValue(doc, m + 20 + colW, row1, 'Date', dateShort, colW);
      drawLabelValue(doc, m + 20 + colW * 2, row1, 'Departure', timeStr, colW);

      const row2 = cardTop + 128;
      drawLabelValue(doc, m + 20, row2, 'Seat', data.seatCode || 'TBD', colW);
      drawLabelValue(doc, m + 20 + colW, row2, 'Class', cabin, colW);
      drawLabelValue(doc, m + 20 + colW * 2, row2, 'Ticket no.', data.ticketNumber || '—', colW);

      const qrSize = 100;
      const qrX = pageW - m - qrSize - 8;
      const qrY = cardTop + cardH + 28;
      if (data.qrCodeData) {
        const qrBuf = await QRCode.toBuffer(data.qrCodeData, { width: qrSize * 2 }).catch(() => null);
        if (qrBuf) {
          doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12).fill('#ffffff');
          doc.lineWidth(0.5).strokeColor(line);
          doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12).stroke();
          doc.image(qrBuf, qrX, qrY, { width: qrSize });
        }
      }

      doc.font('Helvetica').fontSize(7).fillColor(slate).text('Present this document at check-in', m, qrY + 8, { width: qrX - m - 24 });
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('Scan for verification', m, qrY + 22, { width: qrX - m - 24 });

      const footY = qrY + qrSize + 36;
      doc.lineWidth(0.35).strokeColor(line);
      doc.moveTo(m, footY).lineTo(pageW - m, footY).stroke();
      doc.font('Helvetica').fontSize(6.5).fillColor('#94a3b8').text(
        'Arrive at the airport at least 2 hours before international departure. Gate assignment on day of travel.',
        m,
        footY + 10,
        { width: contentW, align: 'center', lineGap: 2 }
      );
      doc.font('Helvetica').fontSize(6).fillColor('#cbd5e1').text(`Issued ${new Date().toISOString().slice(0, 10)} · Dhameys Airlines`, m, footY + 32, { width: contentW, align: 'center' });

      doc.end();

      ws.on('finish', () => resolve(filepath));
      ws.on('error', reject);
    } catch (err) { reject(err); }
  });
}

async function getTicketsForBooking(bookingRef, userId) {
  const booking = await Booking.findOne(userId ? { bookingRef, user: userId } : { bookingRef });
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  return Ticket.find({ booking: booking._id }).lean();
}

async function getTicketPDF(ticketId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket?.pdfUrl) throw Object.assign(new Error('PDF not available'), { status: 404 });
  const filepath = path.join(process.cwd(), ticket.pdfUrl);
  if (!fs.existsSync(filepath)) throw Object.assign(new Error('PDF file not found'), { status: 404 });
  return { filepath, filename: `${ticket.ticketNumber}.pdf` };
}

async function checkIn(bookingRef, passengerId) {
  const ticket = await Ticket.findOne({ bookingRef, passengerId, checkinStatus: { $ne: 'checked_in' } }).populate('flight', 'departureTime');
  if (!ticket) throw Object.assign(new Error('Ticket not found or already checked in'), { status: 404 });
  const dep   = new Date(ticket.flight?.departureTime || ticket.departureTime);
  const hours = (dep - Date.now()) / 3600000;
  if (hours > 48) throw Object.assign(new Error('Check-in opens 48 hours before departure'), { status: 400 });
  if (hours < 1)  throw Object.assign(new Error('Check-in closed 1 hour before departure'), { status: 400 });
  await Ticket.findByIdAndUpdate(ticket._id, { checkinStatus: 'checked_in', checkedInAt: new Date() });
  return { checkedIn: true, ticketId: ticket._id };
}

async function generateTicketNumber() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const num = `DH-${year}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
    if (!(await Ticket.findOne({ ticketNumber: num }))) return num;
  }
  throw new Error('Failed to generate ticket number');
}

module.exports = { generateTicketsForBooking, getTicketsForBooking, getTicketPDF, checkIn };
