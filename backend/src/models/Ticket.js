// src/models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  bookingRef:   { type: String },
  passengerId:  { type: mongoose.Schema.Types.ObjectId }, // embedded passenger id
  passengerName:{ type: String },
  flight:       { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  flightNumber: { type: String },
  originIata:   { type: String },
  destIata:     { type: String },
  departureTime:{ type: Date },
  cabinClass:   { type: String },
  seatCode:     { type: String },

  status:        { type: String, enum: ['issued','used','cancelled','expired','reissued'], default: 'issued' },
  checkinStatus: { type: String, enum: ['not_checked_in','checked_in','boarded'], default: 'not_checked_in' },

  barcodeData:  { type: String },
  qrCodeData:   { type: String },
  pnrCode:      { type: String },
  boardingGroup:{ type: String },
  boardingTime: { type: Date },
  pdfUrl:       { type: String },
  pdfGeneratedAt:{ type: Date },
  checkedInAt:  { type: Date },
  boardedAt:    { type: Date },
}, { timestamps: true });

ticketSchema.index({ booking: 1 });
ticketSchema.index({ pnrCode: 1 });
ticketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
