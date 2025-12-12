const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const verificationController = require('../controllers/verificationController');

const router = express.Router();

// Public verification routes (no authentication required)
router.get('/certificate/:verificationCode', verificationController.verifyCertificateByCode);
router.get('/hash/:certificateHash', verificationController.verifyCertificateByHash);
router.post('/bulk-verify', verificationController.bulkVerifyCertificates);

// QR Code verification
router.get('/qr/:qrData', verificationController.verifyByQRCode);

// Protected verification routes
router.use(authenticate);

// Certificate validation and integrity checks
router.get('/validate/:certificateId', verificationController.validateCertificateIntegrity);
router.get('/ipfs/:cid', verificationController.verifyIPFSData);

// Verification statistics and reports
router.get('/stats', restrictTo('admin', 'verifier'), verificationController.getVerificationStats);
router.get('/audit-log', restrictTo('admin'), verificationController.getAuditLog);

// Verification batch operations
router.post('/batch/validate', restrictTo('admin'), verificationController.batchValidateCertificates);

module.exports = router;