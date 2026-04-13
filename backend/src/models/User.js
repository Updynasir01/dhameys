// src/models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:         { type: String, sparse: true, default: null },
  passwordHash:  { type: String, required: true },
  role:          { type: String, enum: ['customer','agent','admin','superadmin'], default: 'customer' },
  status:        { type: String, enum: ['active','inactive','suspended','pending_verification'], default: 'pending_verification' },

  // Profile
  title:         { type: String, enum: ['Mr','Mrs','Ms','Miss','Dr','Prof', null], default: null },
  firstName:     { type: String, required: true, trim: true },
  lastName:      { type: String, required: true, trim: true },
  dateOfBirth:   { type: Date, default: null },
  gender:        { type: String, enum: ['male','female','other','prefer_not_to_say', null], default: null },
  nationality:   { type: String, maxlength: 2, default: null },
  avatarUrl:     { type: String, default: null },

  // Travel docs
  passportNumber:  { type: String, default: null },
  passportExpiry:  { type: Date,   default: null },
  passportCountry: { type: String, maxlength: 2, default: null },

  // Preferences
  preferredCurrency: { type: String, default: 'USD' },
  preferredLanguage: { type: String, default: 'en' },
  preferredCabin:    { type: String, enum: ['economy','premium_economy','business','first'], default: 'economy' },
  mealPreference:    { type: String, default: null },
  seatPreference:    { type: String, enum: ['window','middle','aisle', null], default: null },

  // 2FA
  twoFaEnabled:     { type: Boolean, default: false },
  twoFaSecret:      { type: String, default: null, select: false },
  twoFaBackupCodes: { type: [String], default: [], select: false },

  // Loyalty
  loyaltyPoints: { type: Number, default: 0 },
  loyaltyTier:   { type: String, default: 'bronze' },

  // Email verification
  emailVerified:      { type: Boolean, default: false },
  emailVerifyToken:   { type: String, default: null, select: false },
  emailVerifyExpires: { type: Date,   default: null },

  // Password reset
  resetToken:        { type: String, default: null, select: false },
  resetTokenExpires: { type: Date,   default: null },

  // GDPR
  gdprConsent:            { type: Boolean, default: false },
  gdprConsentDate:        { type: Date,    default: null },
  marketingConsent:       { type: Boolean, default: false },
  dataDeletionRequested:  { type: Boolean, default: false },
  dataDeletionDate:       { type: Date,    default: null },

  lastLogin:  { type: Date, default: null },
  deletedAt:  { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_, ret) {
      delete ret.passwordHash; delete ret.twoFaSecret;
      delete ret.twoFaBackupCodes; delete ret.resetToken;
      delete ret.emailVerifyToken; delete ret.__v;
      return ret;
    },
  },
});

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('User', userSchema);
