// src/models/index.js — all remaining models

const mongoose = require('mongoose');

// ─── Refresh Token ─────────────────────────────────────────────────────────
const refreshTokenSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:     { type: String, required: true, unique: true },
  userAgent: { type: String },
  ipAddress: { type: String },
  expiresAt: { type: Date, required: true },
  revoked:   { type: Boolean, default: false },
}, { timestamps: true });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete expired
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

// ─── Addon ────────────────────────────────────────────────────────────────
const addonSchema = new mongoose.Schema({
  type:         { type: String, enum: ['extra_baggage','cabin_baggage','meal','seat_upgrade','travel_insurance','lounge_access','priority_boarding','fast_track_security','car_rental','hotel'], required: true },
  name:         { type: String, required: true },
  description:  { type: String },
  price:        { type: Number, required: true },
  currency:     { type: String, default: 'USD' },
  isPerPassenger:{ type: Boolean, default: true },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });
const Addon = mongoose.model('Addon', addonSchema);

// ─── Promo Code ───────────────────────────────────────────────────────────
const promoSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true },
  description:   { type: String },
  discountType:  { type: String, enum: ['percentage','fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount:   { type: Number },
  maxUses:       { type: Number },
  usedCount:     { type: Number, default: 0 },
  perUserLimit:  { type: Number, default: 1 },
  validFrom:     { type: Date },
  validTo:       { type: Date },
  isActive:      { type: Boolean, default: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
promoSchema.index({ code: 1 });
const PromoCode = mongoose.model('PromoCode', promoSchema);

// ─── Promo Usage ──────────────────────────────────────────────────────────
const promoUsageSchema = new mongoose.Schema({
  promo:   { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', required: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  discount:{ type: Number },
}, { timestamps: true });
const PromoUsage = mongoose.model('PromoUsage', promoUsageSchema);

// ─── Loyalty Transaction ──────────────────────────────────────────────────
const loyaltySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  type:        { type: String, enum: ['earned','redeemed','expired','adjusted'], required: true },
  points:      { type: Number, required: true },
  balanceAfter:{ type: Number, required: true },
  description: { type: String },
  expiresAt:   { type: Date },
}, { timestamps: true });
loyaltySchema.index({ user: 1 });
const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltySchema);

// ─── Notification ─────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:    { type: String, required: true },
  channel: { type: String, enum: ['email','sms','push','whatsapp'], default: 'email' },
  subject: { type: String },
  body:    { type: String },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead:  { type: Boolean, default: false },
  sentAt:  { type: Date },
  readAt:  { type: Date },
  error:   { type: String },
}, { timestamps: true });
notificationSchema.index({ user: 1, isRead: 1 });
const Notification = mongoose.model('Notification', notificationSchema);

// ─── Audit Log ────────────────────────────────────────────────────────────
const auditSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:    { type: String, required: true },
  entity:    { type: String },
  entityId:  { type: mongoose.Schema.Types.ObjectId },
  oldData:   { type: mongoose.Schema.Types.Mixed },
  newData:   { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });
auditSchema.index({ user: 1 });
auditSchema.index({ entity: 1, entityId: 1 });
const AuditLog = mongoose.model('AuditLog', auditSchema);

// ─── System Setting ───────────────────────────────────────────────────────
const settingSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: String },
  description: { type: String },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
const Setting = mongoose.model('Setting', settingSchema);

module.exports = {
  RefreshToken, Addon, PromoCode, PromoUsage,
  LoyaltyTransaction, Notification, AuditLog, Setting,
};
