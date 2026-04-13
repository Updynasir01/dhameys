// src/routes/webhook.routes.js — raw body required for Stripe signature
const router  = require('express').Router();
const express = require('express');
const svc     = require('../services/payment.service');

router.post('/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const result = await svc.handleWebhook(req.body, sig);
    res.json(result);
  }
);
module.exports = router;
