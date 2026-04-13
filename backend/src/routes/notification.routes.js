// src/routes/notification.routes.js
const router = require('express').Router();
const { Notification } = require('../models/index');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', async (req, res) => {
  const n = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, data: n });
});
router.put('/:id/read', async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true, readAt: new Date() });
  res.json({ success: true });
});
router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { isRead: true, readAt: new Date() });
  res.json({ success: true });
});
module.exports = router;
