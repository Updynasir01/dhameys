// src/models/Booking.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const passengerSchema = new Schema({
  passengerType:  { type: String, enum: ['adult','child','infant'], default: 'adult' },
  title:          { type: String },
  firstName:      { type: String, required: true },
  lastName:       { type: String, required: true },
  dateOfBirth:    { type: Date },
  nationality:    { type: String, maxlength: 2 },
  passportNumber: { type: String },
  passportExpiry: { type: Date },
  passportCountry:{ type: String, maxlength: 2 },
  mealPreference: { type: String },
  specialAssistance: { type: String },
  frequentFlyerNo:   { type: String },
  seatCode:       { type: String },
}, { _id: true });

const flightSegmentSchema = new Schema({
  flight:       { type: Schema.Types.ObjectId, ref: 'Flight', required: true },
  flightNumber: { type: String },
  originIata:   { type: String },
  destIata:     { type: String },
  departureTime:{ type: Date },
  cabinClass:   { type: String, enum: ['economy','premium_economy','business','first'] },
  fareId:       { type: Schema.Types.ObjectId },
  segmentOrder: { type: Number, default: 1 },
}, { _id: true });

const addonSchema = new Schema({
  addonId:   { type: Schema.Types.ObjectId, ref: 'Addon' },
  name:      { type: String },
  type:      { type: String },
  quantity:  { type: Number, default: 1 },
  unitPrice: { type: Number },
  totalPrice:{ type: Number },
}, { _id: true });

const bookingSchema = new Schema({
  bookingRef:  { type: String, required: true, unique: true },
  user:        { type: Schema.Types.ObjectId, ref: 'User', default: null },
  tripType:    { type: String, enum: ['one_way','round_trip','multi_city'], default: 'one_way' },
  status:      { type: String, enum: ['pending','confirmed','cancelled','refunded','partially_refunded','no_show','completed'], default: 'pending' },

  flights:     [flightSegmentSchema],
  passengers:  [passengerSchema],
  addons:      [addonSchema],

  // Pricing
  subtotal:     { type: Number, required: true },
  taxTotal:     { type: Number, default: 0 },
  addonTotal:   { type: Number, default: 0 },
  discountTotal:{ type: Number, default: 0 },
  totalAmount:  { type: Number, required: true },
  currency:     { type: String, default: 'USD' },

  promoCode:    { type: String },
  promoDiscount:{ type: Number, default: 0 },

  loyaltyPointsUsed:   { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },

  contactEmail: { type: String, required: true, lowercase: true },
  contactPhone: { type: String },

  bookingChannel: { type: String, default: 'web' },

  expiresAt:    { type: Date },
  confirmedAt:  { type: Date },
  cancelledAt:  { type: Date },
  cancellationReason: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

bookingSchema.index({ bookingRef: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ contactEmail: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
