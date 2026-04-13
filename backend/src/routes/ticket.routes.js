// src/routes/ticket.routes.js
const router = require('express').Router();
const svc    = require('../services/ticket.service');
const { optionalAuth, authenticate } = require('../middleware/auth.middleware');
const path = require('path');

router.get('/:ref',      optionalAuth, async (req, res) => res.json({ success: true, data: await svc.getTicketsForBooking(req.params.ref, req.user?.id) }));
router.get('/:id/pdf',   optionalAuth, async (req, res) => {
  const { filepath, filename } = await svc.getTicketPDF(req.params.id);
  res.download(filepath, filename);
});
module.exports = router;
