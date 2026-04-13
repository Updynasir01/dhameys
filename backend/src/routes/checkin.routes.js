// src/routes/checkin.routes.js
const router = require('express').Router();
const svc    = require('../services/ticket.service');
const { optionalAuth } = require('../middleware/auth.middleware');

router.post('/', optionalAuth, async (req, res) => {
  const data = await svc.checkIn(req.body.bookingRef, req.body.passengerId);
  res.json({ success: true, data });
});
module.exports = router;
