// src/routes/flight.routes.js
const router = require('express').Router();
const svc    = require('../services/flight.service');
const { optionalAuth } = require('../middleware/auth.middleware');

router.get('/',             optionalAuth, async (req, res) => res.json({ success: true, data: await svc.search(req.query) }));
router.get('/autocomplete', async (req, res) => res.json({ success: true, data: await svc.autocomplete(req.query.q) }));
router.get('/:id',          async (req, res) => res.json({ success: true, data: await svc.getFlightById(req.params.id) }));
router.get('/:id/seats',    async (req, res) => res.json({ success: true, data: await svc.getSeatMap(req.params.id) }));
router.get('/:id/fare-rules/:fareId', async (req, res) => res.json({ success: true, data: await svc.getFareRules(req.params.id, req.params.fareId) }));
module.exports = router;
