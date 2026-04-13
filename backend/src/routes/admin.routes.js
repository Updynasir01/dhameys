// src/routes/admin.routes.js
const router = require('express').Router();
const svc    = require('../services/admin.service');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard',              async (req, res) => res.json({ success: true, data: await svc.getDashboardStats() }));

// Flights
router.get('/flights',                async (req, res) => res.json({ success: true, data: await svc.listFlights(req.query) }));
router.post('/flights',               async (req, res) => res.status(201).json({ success: true, data: await svc.createFlight(req.body) }));
router.put('/flights/:id',            async (req, res) => res.json({ success: true, data: await svc.updateFlight(req.params.id, req.body) }));
router.delete('/flights/:id',         async (req, res) => res.json({ success: true, data: await svc.deleteFlight(req.params.id) }));

// Users
router.get('/users',                  async (req, res) => res.json({ success: true, data: await svc.listUsers(req.query) }));
router.put('/users/:id/role',         async (req, res) => res.json({ success: true, data: await svc.updateUserRole(req.params.id, req.body.role, req.user.id) }));
router.put('/users/:id/status',       async (req, res) => res.json({ success: true, data: await svc.updateUserStatus(req.params.id, req.body.status, req.user.id) }));
router.post('/users/:id/suspend',     async (req, res) => res.json({ success: true, data: await svc.updateUserStatus(req.params.id, 'suspended', req.user.id) }));

// Bookings
router.get('/bookings',               async (req, res) => res.json({ success: true, data: await svc.listBookings(req.query) }));

// Promos
router.get('/promos',                 async (req, res) => res.json({ success: true, data: await svc.listPromos() }));
router.post('/promos',                async (req, res) => res.status(201).json({ success: true, data: await svc.createPromo(req.body, req.user.id) }));

// Reports
router.get('/reports/revenue',        async (req, res) => res.json({ success: true, data: await svc.getRevenueReport(req.query) }));
router.get('/reports/routes',         async (req, res) => res.json({ success: true, data: await svc.getRouteReport() }));

// Settings
router.get('/settings',               async (req, res) => res.json({ success: true, data: await svc.getSettings() }));
router.put('/settings/:key',          async (req, res) => res.json({ success: true, data: await svc.updateSetting(req.params.key, req.body.value, req.user.id) }));

module.exports = router;
