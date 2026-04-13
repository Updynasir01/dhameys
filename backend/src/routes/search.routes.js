// src/routes/search.routes.js
const router = require('express').Router();
const svc    = require('../services/flight.service');
const { searchFlightRules, validate } = require('../middleware/validate.middleware');

router.get('/flights',      searchFlightRules, validate, async (req, res) => res.json({ success: true, data: await svc.search(req.query) }));
router.get('/autocomplete', async (req, res) => res.json({ success: true, data: await svc.autocomplete(req.query.q) }));
module.exports = router;
