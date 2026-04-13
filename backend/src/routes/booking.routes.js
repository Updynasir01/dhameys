// src/routes/booking.routes.js
const router = require('express').Router();
const svc    = require('../services/booking.service');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { createBookingRules, validate } = require('../middleware/validate.middleware');

router.post('/',     optionalAuth,  createBookingRules, validate, async (req, res) => {
  const data = await svc.createBooking(req.body, req.user?.id);
  res.status(201).json({ success: true, data });
});
router.get('/:ref',  optionalAuth,  async (req, res) => res.json({ success: true, data: await svc.getBooking(req.params.ref, req.user?.id) }));
router.post('/:ref/cancel', optionalAuth, async (req, res) => res.json({ success: true, data: await svc.cancelBooking(req.params.ref, req.user?.id, req.body.reason) }));
module.exports = router;
