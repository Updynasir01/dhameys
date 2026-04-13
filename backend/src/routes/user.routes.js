// src/routes/user.routes.js
const router  = require('express').Router();
const svc     = require('../services/user.service');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/me',                async (req, res) => res.json({ success: true, data: await svc.getProfile(req.user.id) }));
router.put('/me',                async (req, res) => res.json({ success: true, data: await svc.updateProfile(req.user.id, req.body) }));
router.post('/me/change-password', async (req, res) => { await svc.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword); res.json({ success: true }); });
router.get('/me/loyalty',        async (req, res) => res.json({ success: true, data: await svc.getLoyalty(req.user.id) }));
router.get('/me/bookings',       async (req, res) => res.json({ success: true, data: await svc.getUserBookings(req.user.id, req.query) }));
router.delete('/me',             async (req, res) => res.json({ success: true, data: await svc.deleteAccount(req.user.id) }));

module.exports = router;
