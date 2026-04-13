// src/utils/seed.js — MongoDB seed data
// Usage: node src/utils/seed.js

require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const mongoose = require('mongoose');
const Airport  = require('../models/Airport');
const Flight   = require('../models/Flight');
const { Addon, PromoCode, Setting } = require('../models/index');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhameys';
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'dhameys' });
  console.log('\n🌱  Dhameys Airlines — Seeding MongoDB\n');

  // ── Airports ─────────────────────────────────────────────
  console.log('Seeding airports...');
  const airports = await Airport.insertMany([
    { iataCode:'DXB', name:'Dubai International Airport',       city:'Dubai',       country:'AE', countryName:'United Arab Emirates', timezone:'Asia/Dubai',    latitude:25.2532,  longitude:55.3657 },
    { iataCode:'LHR', name:'Heathrow Airport',                  city:'London',      country:'GB', countryName:'United Kingdom',         timezone:'Europe/London', latitude:51.4700,  longitude:-0.4543 },
    { iataCode:'CAI', name:'Cairo International Airport',       city:'Cairo',       country:'EG', countryName:'Egypt',                  timezone:'Africa/Cairo',  latitude:30.1219,  longitude:31.4056 },
    { iataCode:'LOS', name:'Murtala Muhammed Int. Airport',     city:'Lagos',       country:'NG', countryName:'Nigeria',                timezone:'Africa/Lagos',  latitude:6.5774,   longitude:3.3214  },
    { iataCode:'NBO', name:'Jomo Kenyatta International',       city:'Nairobi',     country:'KE', countryName:'Kenya',                  timezone:'Africa/Nairobi',latitude:-1.3192,  longitude:36.9275 },
    { iataCode:'BOM', name:'Chhatrapati Shivaji Int. Airport',  city:'Mumbai',      country:'IN', countryName:'India',                  timezone:'Asia/Kolkata',  latitude:19.0896,  longitude:72.8656 },
    { iataCode:'DOH', name:'Hamad International Airport',       city:'Doha',        country:'QA', countryName:'Qatar',                  timezone:'Asia/Qatar',    latitude:25.2730,  longitude:51.6080 },
    { iataCode:'CDG', name:'Charles de Gaulle Airport',         city:'Paris',       country:'FR', countryName:'France',                 timezone:'Europe/Paris',  latitude:49.0097,  longitude:2.5479  },
    { iataCode:'FRA', name:'Frankfurt Airport',                 city:'Frankfurt',   country:'DE', countryName:'Germany',                timezone:'Europe/Berlin', latitude:50.0379,  longitude:8.5622  },
    { iataCode:'JNB', name:'O.R. Tambo International Airport',  city:'Johannesburg',country:'ZA', countryName:'South Africa',           timezone:'Africa/Johannesburg',latitude:-26.1392,longitude:28.2460},
    { iataCode:'DEL', name:'Indira Gandhi International',       city:'New Delhi',   country:'IN', countryName:'India',                  timezone:'Asia/Kolkata',  latitude:28.5562,  longitude:77.1000 },
    { iataCode:'IST', name:'Istanbul Airport',                  city:'Istanbul',    country:'TR', countryName:'Turkey',                 timezone:'Europe/Istanbul',latitude:41.2753, longitude:28.7519 },
    { iataCode:'KWI', name:'Kuwait International Airport',      city:'Kuwait City', country:'KW', countryName:'Kuwait',                 timezone:'Asia/Kuwait',   latitude:29.2266,  longitude:47.9689 },
    { iataCode:'RUH', name:'King Khalid International',         city:'Riyadh',      country:'SA', countryName:'Saudi Arabia',           timezone:'Asia/Riyadh',   latitude:24.9576,  longitude:46.6988 },
    { iataCode:'JED', name:'King Abdulaziz International',      city:'Jeddah',      country:'SA', countryName:'Saudi Arabia',           timezone:'Asia/Riyadh',   latitude:21.6796,  longitude:39.1565 },
    { iataCode:'ACC', name:'Kotoka International Airport',      city:'Accra',       country:'GH', countryName:'Ghana',                  timezone:'Africa/Accra',  latitude:5.6052,   longitude:-0.1668 },
    { iataCode:'SIN', name:'Singapore Changi Airport',          city:'Singapore',   country:'SG', countryName:'Singapore',              timezone:'Asia/Singapore',latitude:1.3644,   longitude:103.9915},
    { iataCode:'AMS', name:'Amsterdam Airport Schiphol',        city:'Amsterdam',   country:'NL', countryName:'Netherlands',            timezone:'Europe/Amsterdam',latitude:52.3086, longitude:4.7639 },
  ], { ordered: false }).catch(() => Airport.find().lean()); // skip if already exist
  console.log(`  ✓ ${airports.length} airports ready`);

  // Get airport IDs for flights
  const apMap = {};
  const allAirports = await Airport.find().lean();
  for (const a of allAirports) apMap[a.iataCode] = a._id;

  // ── Flights (30 days forward) ──────────────────────────────
  console.log('Seeding flights...');
  const routes = [
    { from:'DXB', to:'LHR', dur:420, ecoPrice:289,  bizPrice:1800, aircraft:'Boeing 787' },
    { from:'LHR', to:'DXB', dur:420, ecoPrice:299,  bizPrice:1850, aircraft:'Boeing 787' },
    { from:'DXB', to:'CAI', dur:210, ecoPrice:149,  bizPrice:750,  aircraft:'Airbus A320' },
    { from:'CAI', to:'DXB', dur:210, ecoPrice:155,  bizPrice:760,  aircraft:'Airbus A320' },
    { from:'DXB', to:'LOS', dur:420, ecoPrice:399,  bizPrice:2200, aircraft:'Boeing 777' },
    { from:'LOS', to:'DXB', dur:420, ecoPrice:410,  bizPrice:2250, aircraft:'Boeing 777' },
    { from:'DXB', to:'BOM', dur:195, ecoPrice:189,  bizPrice:900,  aircraft:'Airbus A320' },
    { from:'BOM', to:'DXB', dur:195, ecoPrice:195,  bizPrice:920,  aircraft:'Airbus A320' },
    { from:'DXB', to:'NBO', dur:300, ecoPrice:349,  bizPrice:1600, aircraft:'Airbus A350' },
    { from:'DXB', to:'JNB', dur:480, ecoPrice:499,  bizPrice:2800, aircraft:'Boeing 787' },
    { from:'DXB', to:'CDG', dur:390, ecoPrice:349,  bizPrice:2100, aircraft:'Airbus A350' },
    { from:'DXB', to:'DEL', dur:210, ecoPrice:199,  bizPrice:1100, aircraft:'Boeing 777' },
  ];

  let flightCount = 0;
  const flightDocs = [];
  for (let day = 1; day <= 30; day++) {
    for (let ri = 0; ri < routes.length; ri++) {
      const r = routes[ri];
      const dep = new Date();
      dep.setDate(dep.getDate() + day);
      dep.setHours(6 + (ri % 3) * 6, 0, 0, 0);
      const arr = new Date(dep.getTime() + r.dur * 60000);

      flightDocs.push({
        flightNumber:  `DH-${String(100 + ri + day * routes.length).slice(-3)}`,
        origin:        apMap[r.from],
        destination:   apMap[r.to],
        originIata:    r.from,
        originCity:    allAirports.find(a=>a.iataCode===r.from)?.city || r.from,
        originName:    allAirports.find(a=>a.iataCode===r.from)?.name || r.from,
        destIata:      r.to,
        destCity:      allAirports.find(a=>a.iataCode===r.to)?.city || r.to,
        destName:      allAirports.find(a=>a.iataCode===r.to)?.name || r.to,
        departureTime: dep,
        arrivalTime:   arr,
        durationMin:   r.dur,
        aircraftType:  r.aircraft,
        status:        'scheduled',
        departureTerminal: 'T3',
        arrivalTerminal:   'T1',
        checkedBaggageKg:  23,
        cabinBaggageKg:    7,
        economyAvailable:  150,
        premiumAvailable:  28,
        businessAvailable: 24,
        firstAvailable:    8,
        fares: [
          { cabinClass:'economy',         basePrice: r.ecoPrice,          taxAmount:45,  fuelSurcharge:25,  serviceFee:15, seatsAvailable:150, seatsTotal:150, fareCode:'Y', refundable:false, changeable:false, milesEarned:500,  isActive:true },
          { cabinClass:'premium_economy', basePrice: r.ecoPrice * 2.2,    taxAmount:90,  fuelSurcharge:50,  serviceFee:15, seatsAvailable:28,  seatsTotal:28,  fareCode:'W', refundable:true,  changeable:true,  milesEarned:1200, isActive:true },
          { cabinClass:'business',        basePrice: r.bizPrice,          taxAmount:180, fuelSurcharge:100, serviceFee:15, seatsAvailable:24,  seatsTotal:24,  fareCode:'J', refundable:true,  changeable:true,  milesEarned:3000, isActive:true },
          { cabinClass:'first',           basePrice: r.bizPrice * 2.5,    taxAmount:280, fuelSurcharge:150, serviceFee:15, seatsAvailable:8,   seatsTotal:8,   fareCode:'F', refundable:true,  changeable:true,  milesEarned:6000, isActive:true },
        ],
      });
      flightCount++;
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < flightDocs.length; i += 100) {
    await Flight.insertMany(flightDocs.slice(i, i+100), { ordered: false }).catch(() => {});
  }
  console.log(`  ✓ ${flightCount} flights seeded`);

  // ── Add-ons ───────────────────────────────────────────────
  console.log('Seeding add-ons...');
  await Addon.insertMany([
    { type:'extra_baggage',    name:'15kg Extra Baggage',          price:45,  description:'Additional 15kg checked baggage' },
    { type:'extra_baggage',    name:'23kg Extra Baggage',          price:65,  description:'Additional 23kg checked baggage' },
    { type:'extra_baggage',    name:'32kg Extra Baggage',          price:90,  description:'Additional 32kg checked baggage' },
    { type:'meal',             name:'Standard Meal',               price:12,  description:'Hot meal served on board' },
    { type:'meal',             name:'Halal Meal',                  price:12,  description:'Certified halal hot meal' },
    { type:'meal',             name:'Vegetarian Meal',             price:12,  description:'Vegetarian hot meal' },
    { type:'meal',             name:'Kids Meal',                   price:10,  description:'Child-friendly meal' },
    { type:'travel_insurance', name:'Basic Travel Insurance',      price:25,  description:'Flight cancellation cover' },
    { type:'travel_insurance', name:'Comprehensive Insurance',     price:55,  description:'Full travel protection' },
    { type:'lounge_access',    name:'Airport Lounge Access',       price:35,  description:'Premium airport lounge access' },
    { type:'priority_boarding',name:'Priority Boarding',           price:15,  description:'Board before general passengers' },
    { type:'seat_upgrade',     name:'Upgrade to Premium Economy',  price:120, description:'Upgrade economy to premium' },
    { type:'seat_upgrade',     name:'Upgrade to Business Class',   price:450, description:'Upgrade to business class' },
  ], { ordered: false }).catch(() => {});
  console.log('  ✓ Add-ons seeded');

  // ── Promo Codes ───────────────────────────────────────────
  console.log('Seeding promo codes...');
  await PromoCode.insertMany([
    { code:'DHAMEYS10', description:'10% off first booking',  discountType:'percentage', discountValue:10, minOrderValue:100, maxDiscount:100,  maxUses:1000, validTo: new Date(Date.now()+365*86400000) },
    { code:'LAUNCH25',  description:'25% launch special',     discountType:'percentage', discountValue:25, minOrderValue:200, maxDiscount:250,  maxUses:500,  validTo: new Date(Date.now()+30*86400000) },
    { code:'FLAT50',    description:'$50 off any booking',    discountType:'fixed',      discountValue:50, minOrderValue:300, maxDiscount:50,   maxUses:2000, validTo: new Date(Date.now()+180*86400000) },
    { code:'BIZI15',    description:'15% off business class', discountType:'percentage', discountValue:15, minOrderValue:800, maxDiscount:500,  maxUses:200,  validTo: new Date(Date.now()+90*86400000) },
    { code:'AFRICA20',  description:'20% off Africa routes',  discountType:'percentage', discountValue:20, minOrderValue:150, maxDiscount:300,  maxUses:300,  validTo: new Date(Date.now()+60*86400000) },
  ], { ordered: false }).catch(() => {});
  console.log('  ✓ Promo codes seeded');

  // ── System Settings ───────────────────────────────────────
  console.log('Seeding settings...');
  const settings = [
    { key:'site_name',             value:'Dhameys Airlines',   description:'Airline brand name' },
    { key:'support_email',         value:'support@dhameys.com',description:'Customer support email' },
    { key:'booking_hold_minutes',  value:'15',                 description:'Seat hold during checkout (mins)' },
    { key:'max_passengers',        value:'9',                  description:'Max passengers per booking' },
    { key:'checkin_opens_hours',   value:'48',                 description:'Hours before departure check-in opens' },
    { key:'checkin_closes_hours',  value:'1',                  description:'Hours before departure check-in closes' },
    { key:'loyalty_earn_rate',     value:'10',                 description:'Points per USD spent' },
    { key:'currency_default',      value:'USD',                description:'Default currency' },
  ];
  for (const s of settings) {
    await Setting.findOneAndUpdate({ key: s.key }, s, { upsert: true });
  }
  console.log('  ✓ Settings seeded');

  console.log('\n✅  Seed complete! Database is ready.\n');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
