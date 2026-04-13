// src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentRef:  { type: String, required: true, unique: true },
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  amount:      { type: Number, required: true },
  currency:    { type: String, default: 'USD' },
  status:      { type: String, enum: ['pending','processing','completed','failed','refunded','partially_refunded','disputed','cancelled'], default: 'pending' },
  method:      { type: String, enum: ['credit_card','debit_card','paypal','bank_transfer','wallet','stripe','test'], default: 'stripe' },

  stripePaymentIntentId: { type: String, sparse: true },
  stripeChargeId:        { type: String },
  stripeCustomerId:      { type: String },

  cardLast4:    { type: String },
  cardBrand:    { type: String },
  cardExpMonth: { type: Number },
  cardExpYear:  { type: Number },

  fraudScore:  { type: Number, default: 0 },
  fraudFlags:  { type: [String], default: [] },
  isFlagged:   { type: Boolean, default: false },

  paidAt:      { type: Date },
  failedAt:    { type: Date },
  failureReason:{ type: String },

  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },
  refundedAt:   { type: Date },
  stripeRefundId:{ type: String },
}, { timestamps: true });

paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
