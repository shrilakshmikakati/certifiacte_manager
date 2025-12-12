const { Certificate, CERTIFICATE_STATUS, CERTIFICATE_TYPES } = require('../models/Certificate');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const ipfsService = require('../services/ipfsService');
const encryptionService = require('../utils/encryption');

// Get all certificates with filtering and pagination
const getAllCertificates = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;
    const institution = req.query.institution;
    const subject = req.query.subject;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (institution) filter['institution.name'] = new RegExp(institution, 'i');
    if (subject) filter['course.subject'] = new RegExp(subject, 'i');

    // Role-based filtering
    if (req.user.role === 'creator') {
        filter.creator = req.user._id;
    }

    // Get certificates with pagination
    const skip = (page - 1) * limit;
    
    const certificates = await Certificate.find(filter)
        .populate('creator', 'username email profile.firstName profile.lastName')
        .populate('verifier.userId', 'username email profile.firstName profile.lastName')
        .populate('issuer.userId', 'username email profile.firstName profile.lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Certificate.countDocuments(filter);

    res.status(200).json({
        success: true,
        results: certificates.length,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        data: {
            certificates
        }
    });
});

// Get single certificate
const getCertificate = catchAsync(async (req, res, next) => {
    const certificate = await Certificate.findById(req.params.id)
        .populate('creator', 'username email profile.firstName profile.lastName')
        .populate('verifier.userId', 'username email profile.firstName profile.lastName')
        .populate('issuer.userId', 'username email profile.firstName profile.lastName');

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    // Check if user has permission to view this certificate
    const canView = 
        certificate.creator.toString() === req.user._id.toString() ||
        req.user.permissions.includes('view_all_certificates') ||
        req.user.role === 'admin';

    if (!canView) {
        return next(new AppError('You do not have permission to view this certificate', 403));
    }

    res.status(200).json({
        success: true,
        data: {
            certificate
        }
    });
});

// Create new certificate
const createCertificate = catchAsync(async (req, res, next) => {
    const {
        title,
        type,
        description,
        recipient,
        institution,
        course,
        metadata
    } = req.body;

    // Validate required fields
    if (!title || !recipient || !institution || !course) {
        return next(new AppError('Please provide all required certificate information', 400));
    }

    // Generate certificate hash
    const certificateData = {
        title,
        type: type || 'academic',
        recipient,
        institution,
        course,
        createdAt: new Date()
    };

    const certificateHash = encryptionService.generateCertificateHash(certificateData);

    // Encrypt certificate data for IPFS storage
    const encryptionPassword = encryptionService.generateSecurePassword();
    const encryptedCertificate = encryptionService.encryptCertificate(
        certificateData, 
        encryptionPassword
    );

    // Upload to IPFS
    const ipfsResult = await ipfsService.uploadJSON(encryptedCertificate, {
        name: `certificate-${certificateHash}`,
        keyvalues: {
            certificateId: certificateHash,
            type: 'encrypted-certificate',
            creator: req.user.email
        }
    });

    // Create certificate record
    const certificate = await Certificate.create({
        title,
        type: type || 'academic',
        description,
        recipient,
        institution,
        course,
        creator: req.user._id,
        blockchain: {
            certificateHash,
            network: 'Ganache'
        },
        ipfs: {
            cid: ipfsResult.cid,
            encryptionKey: encryptionPassword,
            isEncrypted: true
        },
        metadata
    });

    // Add to history
    await certificate.addHistoryEntry('created', req.user._id, 'Certificate created');

    logger.info(`Certificate created: ${certificate.certificateId} by ${req.user.email}`);

    res.status(201).json({
        success: true,
        message: 'Certificate created successfully',
        data: {
            certificate
        }
    });
});

// Update certificate (only before verification)
const updateCertificate = catchAsync(async (req, res, next) => {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    // Only allow updates if certificate is pending
    if (certificate.status !== CERTIFICATE_STATUS.PENDING) {
        return next(new AppError('Cannot update certificate after verification', 400));
    }

    // Fields that can be updated
    const allowedFields = ['title', 'description', 'recipient', 'institution', 'course', 'metadata'];
    const filteredBody = {};

    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredBody[key] = req.body[key];
        }
    });

    const updatedCertificate = await Certificate.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        { new: true, runValidators: true }
    );

    // Add to history
    await updatedCertificate.addHistoryEntry('updated', req.user._id, 'Certificate updated');

    logger.info(`Certificate updated: ${certificate.certificateId} by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'Certificate updated successfully',
        data: {
            certificate: updatedCertificate
        }
    });
});

// Delete certificate (only if pending)
const deleteCertificate = catchAsync(async (req, res, next) => {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    // Only allow deletion if certificate is pending
    if (certificate.status !== CERTIFICATE_STATUS.PENDING) {
        return next(new AppError('Cannot delete certificate after verification', 400));
    }

    // Remove from IPFS (optional - may want to keep for audit)
    try {
        await ipfsService.unpinContent(certificate.ipfs.cid);
    } catch (error) {
        logger.warn('Failed to unpin IPFS content:', error);
    }

    await Certificate.findByIdAndDelete(req.params.id);

    logger.info(`Certificate deleted: ${certificate.certificateId} by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully'
    });
});

// Verify certificate (approve/reject)
const verifyCertificate = catchAsync(async (req, res, next) => {
    const { approved, comments } = req.body;
    
    if (typeof approved !== 'boolean') {
        return next(new AppError('Please specify whether certificate is approved or rejected', 400));
    }

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    if (certificate.status !== CERTIFICATE_STATUS.PENDING) {
        return next(new AppError('Certificate has already been verified', 400));
    }

    // Update certificate status
    certificate.status = approved ? CERTIFICATE_STATUS.APPROVED : CERTIFICATE_STATUS.REJECTED;
    certificate.verifier = {
        userId: req.user._id,
        verifiedAt: new Date(),
        comments: comments || ''
    };

    await certificate.save();

    // Add to history
    const action = approved ? 'approved' : 'rejected';
    await certificate.addHistoryEntry(action, req.user._id, comments || '');

    logger.info(`Certificate ${action}: ${certificate.certificateId} by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: `Certificate ${action} successfully`,
        data: {
            certificate
        }
    });
});

// Issue certificate
const issueCertificate = catchAsync(async (req, res, next) => {
    const { comments } = req.body;

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    if (certificate.status !== CERTIFICATE_STATUS.APPROVED) {
        return next(new AppError('Certificate must be approved before issuance', 400));
    }

    // Update certificate status
    certificate.status = CERTIFICATE_STATUS.ISSUED;
    certificate.issuer = {
        userId: req.user._id,
        issuedAt: new Date(),
        comments: comments || ''
    };

    // Generate verification code
    certificate.verification.isVerified = true;

    await certificate.save();

    // Add to history
    await certificate.addHistoryEntry('issued', req.user._id, comments || '');

    // TODO: Interact with blockchain to record issuance
    // TODO: Generate PDF certificate
    // TODO: Send notification to recipient

    logger.info(`Certificate issued: ${certificate.certificateId} by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'Certificate issued successfully',
        data: {
            certificate
        }
    });
});

// Revoke certificate
const revokeCertificate = catchAsync(async (req, res, next) => {
    const { reason } = req.body;

    if (!reason) {
        return next(new AppError('Please provide reason for revocation', 400));
    }

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    if (certificate.status !== CERTIFICATE_STATUS.ISSUED) {
        return next(new AppError('Only issued certificates can be revoked', 400));
    }

    // Update certificate status
    certificate.status = CERTIFICATE_STATUS.REVOKED;
    certificate.verification.isVerified = false;

    await certificate.save();

    // Add to history
    await certificate.addHistoryEntry('revoked', req.user._id, reason);

    logger.info(`Certificate revoked: ${certificate.certificateId} by ${req.user.email}, reason: ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Certificate revoked successfully',
        data: {
            certificate
        }
    });
});

// Batch create certificates
const batchCreateCertificates = catchAsync(async (req, res, next) => {
    const { certificates: certificateDataArray } = req.body;

    if (!Array.isArray(certificateDataArray) || certificateDataArray.length === 0) {
        return next(new AppError('Please provide an array of certificates', 400));
    }

    if (certificateDataArray.length > 100) {
        return next(new AppError('Batch size cannot exceed 100 certificates', 400));
    }

    const createdCertificates = [];
    const errors = [];

    for (let i = 0; i < certificateDataArray.length; i++) {
        try {
            const certData = certificateDataArray[i];
            
            // Set creator and process each certificate
            req.body = certData;
            
            const result = await createSingleCertificate(certData, req.user);
            createdCertificates.push(result);

        } catch (error) {
            errors.push({
                index: i,
                data: certificateDataArray[i],
                error: error.message
            });
        }
    }

    logger.info(`Batch certificate creation: ${createdCertificates.length} created, ${errors.length} failed by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'Batch certificate creation completed',
        data: {
            created: createdCertificates.length,
            failed: errors.length,
            certificates: createdCertificates,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

// Helper function for single certificate creation
const createSingleCertificate = async (certData, user) => {
    const certificateHash = encryptionService.generateCertificateHash(certData);
    const encryptionPassword = encryptionService.generateSecurePassword();
    const encryptedCertificate = encryptionService.encryptCertificate(certData, encryptionPassword);
    
    const ipfsResult = await ipfsService.uploadJSON(encryptedCertificate, {
        name: `certificate-${certificateHash}`,
        keyvalues: {
            certificateId: certificateHash,
            type: 'encrypted-certificate',
            creator: user.email
        }
    });

    return await Certificate.create({
        ...certData,
        creator: user._id,
        blockchain: { certificateHash, network: 'Ganache' },
        ipfs: {
            cid: ipfsResult.cid,
            encryptionKey: encryptionPassword,
            isEncrypted: true
        }
    });
};

// Get certificates by status
const getCertificatesByStatus = catchAsync(async (req, res, next) => {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!Object.values(CERTIFICATE_STATUS).includes(status)) {
        return next(new AppError('Invalid certificate status', 400));
    }

    const certificates = await Certificate.findByStatus(status, 'creator verifier.userId issuer.userId');
    
    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedCertificates = certificates.slice(skip, skip + limit);

    res.status(200).json({
        success: true,
        results: paginatedCertificates.length,
        pagination: {
            page,
            limit,
            total: certificates.length,
            pages: Math.ceil(certificates.length / limit)
        },
        data: {
            certificates: paginatedCertificates
        }
    });
});

// Get certificates by creator
const getCertificatesByCreator = catchAsync(async (req, res, next) => {
    const { creatorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const certificates = await Certificate.find({ creator: creatorId })
        .populate('creator', 'username email profile.firstName profile.lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Certificate.countDocuments({ creator: creatorId });

    res.status(200).json({
        success: true,
        results: certificates.length,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        data: {
            certificates
        }
    });
});

// Search certificates
const searchCertificates = catchAsync(async (req, res, next) => {
    const { q, type, status, institution, subject } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Build search query
    const searchQuery = {};

    if (q) {
        searchQuery.$or = [
            { 'recipient.name': new RegExp(q, 'i') },
            { 'recipient.studentId': new RegExp(q, 'i') },
            { title: new RegExp(q, 'i') },
            { certificateId: new RegExp(q, 'i') }
        ];
    }

    if (type) searchQuery.type = type;
    if (status) searchQuery.status = status;
    if (institution) searchQuery['institution.name'] = new RegExp(institution, 'i');
    if (subject) searchQuery['course.subject'] = new RegExp(subject, 'i');

    // Role-based filtering
    if (req.user.role === 'creator') {
        searchQuery.creator = req.user._id;
    }

    const skip = (page - 1) * limit;

    const certificates = await Certificate.find(searchQuery)
        .populate('creator', 'username email profile.firstName profile.lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await Certificate.countDocuments(searchQuery);

    res.status(200).json({
        success: true,
        results: certificates.length,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        data: {
            certificates
        }
    });
});

// Public certificate verification
const verifyCertificatePublic = catchAsync(async (req, res, next) => {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findByVerificationCode(verificationCode);

    if (!certificate) {
        return next(new AppError('Invalid verification code or certificate not found', 404));
    }

    // Return public information only
    const publicData = {
        certificateId: certificate.certificateId,
        title: certificate.title,
        recipient: certificate.recipient,
        institution: certificate.institution,
        course: certificate.course,
        status: certificate.status,
        issuedAt: certificate.issuer.issuedAt,
        verificationCode: certificate.verification.verificationCode,
        isVerified: certificate.verification.isVerified
    };

    res.status(200).json({
        success: true,
        data: {
            certificate: publicData
        }
    });
});

// Get certificate statistics (admin only)
const getCertificateStats = catchAsync(async (req, res, next) => {
    const stats = await Certificate.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const typeStats = await Certificate.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    const totalCertificates = await Certificate.countDocuments();
    const totalThisMonth = await Certificate.countDocuments({
        createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        }
    });

    res.status(200).json({
        success: true,
        data: {
            total: totalCertificates,
            thisMonth: totalThisMonth,
            byStatus: stats,
            byType: typeStats
        }
    });
});

// Get certificate trends (admin only)
const getCertificateTrends = catchAsync(async (req, res, next) => {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
        case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const trends = await Certificate.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            trends,
            period
        }
    });
});

module.exports = {
    getAllCertificates,
    getCertificate,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    verifyCertificate,
    issueCertificate,
    revokeCertificate,
    batchCreateCertificates,
    getCertificatesByStatus,
    getCertificatesByCreator,
    searchCertificates,
    verifyCertificatePublic,
    getCertificateStats,
    getCertificateTrends
};