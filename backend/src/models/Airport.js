// src/models/Airport.js
const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
  iataCode:    { type: String, required: true, unique: true, uppercase: true, length: 3 },
  icaoCode:    { type: String, sparse: true, uppercase: true },
  name:        { type: String, required: true },
  city:        { type: String, required: true },
  country:     { type: String, required: true, length: 2 },
  countryName: { type: String, required: true },
  timezone:    { type: String, required: true },
  latitude:    { type: Number },
  longitude:   { type: Number },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

airportSchema.index({ iataCode: 1 });
airportSchema.index({ city: 'text', name: 'text' });

module.exports = mongoose.model('Airport', airportSchema);
