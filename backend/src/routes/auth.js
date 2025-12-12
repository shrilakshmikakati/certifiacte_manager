const express = require('express');
const { authenticate, restrictTo, validateWalletSignature, authRateLimit, logAuthEvents } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Apply rate limiting to authentication routes
router.use(authRateLimit(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes

// Public routes
router.post('/register', logAuthEvents('register'), authController.register);
router.post('/login', logAuthEvents('login'), authController.login);
router.post('/wallet-login', logAuthEvents('wallet-login'), validateWalletSignature, authController.walletLogin);
router.post('/forgot-password', logAuthEvents('forgot-password'), authController.forgotPassword);
router.patch('/reset-password/:token', logAuthEvents('reset-password'), authController.resetPassword);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.patch('/update-password', authController.updatePassword);
router.post('/logout', logAuthEvents('logout'), authController.logout);

// Admin only routes
router.get('/users', restrictTo('admin'), authController.getAllUsers);
router.patch('/users/:id/role', restrictTo('admin'), authController.updateUserRole);
router.patch('/users/:id/status', restrictTo('admin'), authController.updateUserStatus);

module.exports = router;