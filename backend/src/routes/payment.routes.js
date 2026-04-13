// src/routes/payment.routes.js
const router  = require('express').Router();
const svc     = require('../services/payment.service');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { paymentIntentRules, validate } = require('../middleware/validate.middleware');
const express = require('express');

router.post('/intent',   optionalAuth, paymentIntentRules, validate,
  async (req, res) => res.json({ success: true, data: await svc.createPaymentIntent(req.body.bookingId, req.user?.id, req.body.currency) }));
router.post('/confirm',
  async (req, res) => res.json({ success: true, data: await svc.confirmPayment(req.body.paymentIntentId) }));
router.post('/:id/refund', optionalAuth,
  async (req, res) => res.json({ success: true, data: await svc.createRefund(req.params.id, req.user?.id, req.body.reason) }));
module.exports = router;
