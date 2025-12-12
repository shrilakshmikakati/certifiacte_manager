const express = require('express');
const { authenticate, restrictTo, requirePermissions, checkOwnership } = require('../middleware/auth');
const certificateController = require('../controllers/certificateController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Certificate CRUD operations
router
    .route('/')
    .get(certificateController.getAllCertificates)
    .post(
        requirePermissions('create_certificates'),
        certificateController.createCertificate
    );

router
    .route('/:id')
    .get(certificateController.getCertificate)
    .patch(
        checkOwnership('creator'),
        certificateController.updateCertificate
    )
    .delete(
        checkOwnership('creator'),
        certificateController.deleteCertificate
    );

// Certificate workflow routes
router.patch(
    '/:id/verify',
    requirePermissions('verify_certificates'),
    certificateController.verifyCertificate
);

router.patch(
    '/:id/issue',
    requirePermissions('issue_certificates'),
    certificateController.issueCertificate
);

router.patch(
    '/:id/revoke',
    requirePermissions('issue_certificates'),
    certificateController.revokeCertificate
);

// Batch operations
router.post(
    '/batch/create',
    requirePermissions('create_certificates'),
    certificateController.batchCreateCertificates
);

// Certificate queries
router.get('/status/:status', certificateController.getCertificatesByStatus);
router.get('/creator/:creatorId', certificateController.getCertificatesByCreator);
router.get('/search', certificateController.searchCertificates);

// Certificate verification (public)
router.get('/verify/:verificationCode', certificateController.verifyCertificatePublic);

// Certificate analytics (admin only)
router.get('/analytics/stats', restrictTo('admin'), certificateController.getCertificateStats);
router.get('/analytics/trends', restrictTo('admin'), certificateController.getCertificateTrends);

module.exports = router;