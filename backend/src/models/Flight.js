// src/models/Flight.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const fareRuleSchema = new Schema({
  cabinClass:      { type: String, enum: ['economy','premium_economy','business','first'], required: true },
  basePrice:       { type: Number, required: true },
  taxAmount:       { type: Number, default: 0 },
  fuelSurcharge:   { type: Number, default: 0 },
  serviceFee:      { type: Number, default: 15 },
  currency:        { type: String, default: 'USD' },
  seatsAvailable:  { type: Number, required: true },
  seatsTotal:      { type: Number, required: true },
  fareCode:        { type: String },
  refundable:      { type: Boolean, default: false },
  changeable:      { type: Boolean, default: false },
  changeFee:       { type: Number, default: 0 },
  milesEarned:     { type: Number, default: 500 },
  isActive:        { type: Boolean, default: true },
}, { _id: true });

fareRuleSchema.virtual('totalPrice').get(function() {
  return this.basePrice + this.taxAmount + this.fuelSurcharge + this.serviceFee;
});

const flightSchema = new Schema({
  flightNumber: { type: String, required: true },

  // References stored as IATA codes for easy querying (denormalized)
  originIata:   { type: String, required: true, uppercase: true },
  originCity:   { type: String },
  originName:   { type: String },
  destIata:     { type: String, required: true, uppercase: true },
  destCity:     { type: String },
  destName:     { type: String },

  // Airport refs
  origin:       { type: Schema.Types.ObjectId, ref: 'Airport' },
  destination:  { type: Schema.Types.ObjectId, ref: 'Airport' },

  departureTime:    { type: Date, required: true },
  arrivalTime:      { type: Date, required: true },
  durationMin:      { type: Number },
  departureTerminal:{ type: String },
  arrivalTerminal:  { type: String },
  departureGate:    { type: String },
  arrivalGate:      { type: String },

  status: {
    type: String,
    enum: ['scheduled','delayed','boarding','departed','in_air','landed','arrived','cancelled','diverted'],
    default: 'scheduled',
  },
  delayMinutes:       { type: Number, default: 0 },
  delayReason:        { type: String },
  cancellationReason: { type: String },

  aircraftType:     { type: String },
  aircraftReg:      { type: String },

  checkedBaggageKg: { type: Number, default: 23 },
  cabinBaggageKg:   { type: Number, default: 7 },

  economyAvailable: { type: Number, default: 0 },
  premiumAvailable: { type: Number, default: 0 },
  businessAvailable:{ type: Number, default: 0 },
  firstAvailable:   { type: Number, default: 0 },

  fares: [fareRuleSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

flightSchema.virtual('minPrice').get(function() {
  if (!this.fares?.length) return null;
  return Math.min(...this.fares.map(f => f.basePrice + f.taxAmount + f.fuelSurcharge + f.serviceFee));
});

flightSchema.index({ originIata: 1, destIata: 1, departureTime: 1 });
flightSchema.index({ departureTime: 1 });
flightSchema.index({ status: 1 });
flightSchema.index({ flightNumber: 1 });
// Text search on cities
flightSchema.index({ originCity: 'text', destCity: 'text', originIata: 'text', destIata: 'text' });

module.exports = mongoose.model('Flight', flightSchema);
