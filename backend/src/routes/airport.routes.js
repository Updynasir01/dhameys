// src/routes/airport.routes.js
const router  = require('express').Router();
const Airport = require('../models/Airport');

router.get('/', async (req, res) => {
  const airports = await Airport.find({ isActive: true }).sort({ city: 1 }).lean();
  res.json({ success: true, data: airports });
});
router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 2) return res.json({ success: true, data: [] });
  const airports = await Airport.find({
    isActive: true,
    $or: [{ iataCode: new RegExp('^'+q,'i') }, { city: new RegExp(q,'i') }, { name: new RegExp(q,'i') }],
  }).limit(10).lean();
  res.json({ success: true, data: airports });
});
router.get('/:iata', async (req, res) => {
  const a = await Airport.findOne({ iataCode: req.params.iata.toUpperCase() }).lean();
  if (!a) return res.status(404).json({ error: 'Airport not found' });
  res.json({ success: true, data: a });
});
module.exports = router;
