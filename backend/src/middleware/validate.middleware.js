// src/middleware/validate.middleware.js
const { validationResult, body, param, query } = require('express-validator');

// Run validation and return 422 on errors
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error:   'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ─── Auth validators ───────────────────────────────────────────────────────
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('firstName').trim().notEmpty().isLength({ max: 100 }).withMessage('First name required'),
  body('lastName').trim().notEmpty().isLength({ max: 100 }).withMessage('Last name required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('gdprConsent').equals('true').withMessage('GDPR consent required'),
];

const loginRules = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').trim().notEmpty(),
];

const resetPasswordRules = [
  body('token').notEmpty(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[0-9]/),
];

// ─── Flight search validators ──────────────────────────────────────────────
const searchFlightRules = [
  query('origin').trim().isLength({ min: 3, max: 3 }).toUpperCase(),
  query('destination').trim().isLength({ min: 3, max: 3 }).toUpperCase(),
  // YYYY-MM-DD from the flight search form (validator isDate can be picky across versions)
  query('departureDate').trim().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('departureDate must be YYYY-MM-DD'),
  query('adults').optional().isInt({ min: 1, max: 9 }).toInt(),
  query('children').optional().isInt({ min: 0, max: 8 }).toInt(),
  query('infants').optional().isInt({ min: 0, max: 4 }).toInt(),
  query('cabinClass').optional().isIn(['economy', 'premium_economy', 'business', 'first']),
  query('sortBy').optional().isIn(['price', 'duration', 'departure']),
  query('page').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('size').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// ─── Booking validators ────────────────────────────────────────────────────
const createBookingRules = [
  body('tripType').isIn(['one_way','round_trip','multi_city']),
  body('outboundFlightId').isMongoId().withMessage('Invalid flight id'),
  body('returnFlightId').optional({ values: 'falsy' }).isMongoId(),
  body('cabinClass').isIn(['economy','premium_economy','business','first']),
  body('fareRuleId').isMongoId().withMessage('Invalid fare id'),
  body('passengers').isArray({ min: 1, max: 9 }),
  body('passengers.*.firstName').notEmpty(),
  body('passengers.*.lastName').notEmpty(),
  body('passengers.*.passengerType').isIn(['adult','child','infant']),
  body('contactEmail').isEmail().normalizeEmail(),
];

// ─── Payment validators ────────────────────────────────────────────────────
const paymentIntentRules = [
  body('bookingId').isMongoId().withMessage('Invalid booking id'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  resetPasswordRules,
  searchFlightRules,
  createBookingRules,
  paymentIntentRules,
};
