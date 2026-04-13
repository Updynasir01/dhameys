// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, registerRules, loginRules, resetPasswordRules } = require('../middleware/validate.middleware');

router.post('/register',         registerRules, validate, ctrl.register);
router.post('/login',            loginRules,    validate, ctrl.login);
router.post('/logout',           authenticate,           ctrl.logout);
router.post('/refresh',                                  ctrl.refresh);
router.post('/forgot-password',                          ctrl.forgotPassword);
router.post('/reset-password',   resetPasswordRules, validate, ctrl.resetPassword);
router.post('/verify-email',                            ctrl.verifyEmail);
router.get ('/verify-email',                            ctrl.verifyEmail);
router.post('/2fa/setup',        authenticate,           ctrl.setup2FA);
router.post('/2fa/enable',       authenticate,           ctrl.enable2FA);
router.post('/2fa/verify',                               ctrl.verify2FA);
router.post('/2fa/disable',      authenticate,           ctrl.disable2FA);

module.exports = router;
