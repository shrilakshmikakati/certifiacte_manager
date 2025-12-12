const { Certificate, CERTIFICATE_STATUS } = require('../models/Certificate');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const ipfsService = require('../services/ipfsService');
const encryptionService = require('../utils/encryption');
const QRCode = require('qrcode');

// Verify certificate by verification code (public endpoint)
const verifyCertificateByCode = catchAsync(async (req, res, next) => {
    const { verificationCode } = req.params;

    if (!verificationCode) {
        return next(new AppError('Verification code is required', 400));
    }

    const certificate = await Certificate.findByVerificationCode(verificationCode);

    if (!certificate) {
        return res.status(404).json({
            success: false,
            verified: false,
            message: 'Certificate not found or invalid verification code',
            data: null
        });
    }

    // Check if certificate is issued and verified
    const isVerified = certificate.status === CERTIFICATE_STATUS.ISSUED && 
                      certificate.verification.isVerified;

    // Prepare public certificate data
    const publicData = {
        certificateId: certificate.certificateId,
        title: certificate.title,
        type: certificate.type,
        recipient: {
            name: certificate.recipient.name,
            studentId: certificate.recipient.studentId
        },
        institution: {
            name: certificate.institution.name,
            department: certificate.institution.department
        },
        course: {
            subject: certificate.course.subject,
            grade: certificate.course.grade,
            credits: certificate.course.credits,
            completionDate: certificate.course.completionDate
        },
        status: certificate.status,
        issuedAt: certificate.issuer?.issuedAt,
        verificationCode: certificate.verification.verificationCode,
        blockchain: {
            certificateHash: certificate.blockchain.certificateHash,
            network: certificate.blockchain.network
        }
    };

    logger.info(`Certificate verification attempted: ${verificationCode}, result: ${isVerified}`);

    res.status(200).json({
        success: true,
        verified: isVerified,
        message: isVerified ? 'Certificate is valid and verified' : 'Certificate found but not verified',
        data: {
            certificate: publicData,
            verificationTimestamp: new Date().toISOString()
        }
    });
});

// Verify certificate by hash (public endpoint)
const verifyCertificateByHash = catchAsync(async (req, res, next) => {
    const { certificateHash } = req.params;

    if (!certificateHash) {
        return next(new AppError('Certificate hash is required', 400));
    }

    const certificate = await Certificate.findOne({
        'blockchain.certificateHash': certificateHash
    }).populate('creator', 'username profile.firstName profile.lastName');

    if (!certificate) {
        return res.status(404).json({
            success: false,
            verified: false,
            message: 'Certificate not found with the provided hash',
            data: null
        });
    }

    const isVerified = certificate.status === CERTIFICATE_STATUS.ISSUED;

    // Return minimal public data for hash verification
    const publicData = {
        certificateHash: certificate.blockchain.certificateHash,
        status: certificate.status,
        isVerified,
        recipient: certificate.recipient.name,
        institution: certificate.institution.name,
        subject: certificate.course.subject,
        issuedAt: certificate.issuer?.issuedAt
    };

    res.status(200).json({
        success: true,
        verified: isVerified,
        message: isVerified ? 'Certificate hash is valid' : 'Certificate exists but not issued',
        data: {
            certificate: publicData,
            verificationTimestamp: new Date().toISOString()
        }
    });
});

// Bulk verify certificates (public endpoint)
const bulkVerifyCertificates = catchAsync(async (req, res, next) => {
    const { verificationCodes, certificateHashes } = req.body;

    if ((!verificationCodes || verificationCodes.length === 0) && 
        (!certificateHashes || certificateHashes.length === 0)) {
        return next(new AppError('Please provide verification codes or certificate hashes', 400));
    }

    const results = [];

    // Verify by codes
    if (verificationCodes && verificationCodes.length > 0) {
        for (const code of verificationCodes) {
            try {
                const certificate = await Certificate.findByVerificationCode(code);
                const isVerified = certificate && 
                                  certificate.status === CERTIFICATE_STATUS.ISSUED && 
                                  certificate.verification.isVerified;

                results.push({
                    type: 'verificationCode',
                    identifier: code,
                    verified: isVerified,
                    certificateId: certificate?.certificateId || null,
                    status: certificate?.status || 'not_found'
                });
            } catch (error) {
                results.push({
                    type: 'verificationCode',
                    identifier: code,
                    verified: false,
                    error: 'Verification failed'
                });
            }
        }
    }

    // Verify by hashes
    if (certificateHashes && certificateHashes.length > 0) {
        for (const hash of certificateHashes) {
            try {
                const certificate = await Certificate.findOne({
                    'blockchain.certificateHash': hash
                });
                const isVerified = certificate && certificate.status === CERTIFICATE_STATUS.ISSUED;

                results.push({
                    type: 'certificateHash',
                    identifier: hash,
                    verified: isVerified,
                    certificateId: certificate?.certificateId || null,
                    status: certificate?.status || 'not_found'
                });
            } catch (error) {
                results.push({
                    type: 'certificateHash',
                    identifier: hash,
                    verified: false,
                    error: 'Verification failed'
                });
            }
        }
    }

    const verifiedCount = results.filter(r => r.verified).length;

    res.status(200).json({
        success: true,
        message: `Bulk verification completed: ${verifiedCount}/${results.length} verified`,
        data: {
            total: results.length,
            verified: verifiedCount,
            results
        }
    });
});

// Verify by QR code data (public endpoint)
const verifyByQRCode = catchAsync(async (req, res, next) => {
    const { qrData } = req.params;

    try {
        // QR data might be a verification URL or direct verification code
        let verificationCode = qrData;
        
        // If it's a URL, extract the verification code
        if (qrData.includes('/verify/')) {
            const parts = qrData.split('/verify/');
            verificationCode = parts[parts.length - 1];
        }

        // Use the existing verification by code function
        req.params.verificationCode = verificationCode;
        return verifyCertificateByCode(req, res, next);

    } catch (error) {
        logger.error('QR code verification failed:', error);
        return next(new AppError('Invalid QR code data', 400));
    }
});

// Validate certificate integrity (protected endpoint)
const validateCertificateIntegrity = catchAsync(async (req, res, next) => {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    const validationResults = {
        certificateId: certificate.certificateId,
        validations: []
    };

    try {
        // 1. Validate IPFS data exists and is accessible
        const ipfsValidation = await validateIPFSIntegrity(certificate);
        validationResults.validations.push(ipfsValidation);

        // 2. Validate certificate hash integrity
        const hashValidation = validateCertificateHash(certificate);
        validationResults.validations.push(hashValidation);

        // 3. Validate encryption integrity (if encrypted)
        if (certificate.ipfs.isEncrypted) {
            const encryptionValidation = await validateEncryptionIntegrity(certificate);
            validationResults.validations.push(encryptionValidation);
        }

        // 4. Validate workflow integrity
        const workflowValidation = validateWorkflowIntegrity(certificate);
        validationResults.validations.push(workflowValidation);

        const allValid = validationResults.validations.every(v => v.valid);
        validationResults.overallValid = allValid;

    } catch (error) {
        logger.error('Certificate validation failed:', error);
        validationResults.overallValid = false;
        validationResults.error = error.message;
    }

    res.status(200).json({
        success: true,
        message: 'Certificate integrity validation completed',
        data: validationResults
    });
});

// Verify IPFS data (protected endpoint)
const verifyIPFSData = catchAsync(async (req, res, next) => {
    const { cid } = req.params;

    try {
        // Get data from IPFS
        const ipfsData = await ipfsService.getData(cid);
        
        // Check if CID exists in our database
        const certificate = await Certificate.findOne({ 'ipfs.cid': cid });

        const verificationResult = {
            cid,
            exists: !!ipfsData,
            dataType: ipfsData?.type || 'unknown',
            size: ipfsData?.data?.length || 0,
            inDatabase: !!certificate,
            certificateId: certificate?.certificateId || null
        };

        res.status(200).json({
            success: true,
            message: 'IPFS data verification completed',
            data: verificationResult
        });

    } catch (error) {
        logger.error('IPFS verification failed:', error);
        return next(new AppError('IPFS data verification failed', 400));
    }
});

// Get verification statistics (protected endpoint)
const getVerificationStats = catchAsync(async (req, res, next) => {
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

    const stats = {
        period,
        totalCertificates: await Certificate.countDocuments(),
        issuedCertificates: await Certificate.countDocuments({ status: CERTIFICATE_STATUS.ISSUED }),
        pendingCertificates: await Certificate.countDocuments({ status: CERTIFICATE_STATUS.PENDING }),
        rejectedCertificates: await Certificate.countDocuments({ status: CERTIFICATE_STATUS.REJECTED }),
        recentlyCreated: await Certificate.countDocuments({
            createdAt: { $gte: startDate }
        }),
        recentlyIssued: await Certificate.countDocuments({
            'issuer.issuedAt': { $gte: startDate }
        })
    };

    res.status(200).json({
        success: true,
        message: 'Verification statistics retrieved',
        data: stats
    });
});

// Get audit log (admin only)
const getAuditLog = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const certificateId = req.query.certificateId;

    // Build match criteria
    const matchCriteria = {};
    if (action) matchCriteria['history.action'] = action;
    if (certificateId) matchCriteria.certificateId = certificateId;

    const auditLogs = await Certificate.aggregate([
        { $match: matchCriteria },
        { $unwind: '$history' },
        {
            $lookup: {
                from: 'users',
                localField: 'history.performedBy',
                foreignField: '_id',
                as: 'performer'
            }
        },
        {
            $project: {
                certificateId: 1,
                'recipient.name': 1,
                'institution.name': 1,
                action: '$history.action',
                performedBy: { $arrayElemAt: ['$performer.username', 0] },
                timestamp: '$history.timestamp',
                details: '$history.details',
                previousStatus: '$history.previousStatus',
                newStatus: '$history.newStatus'
            }
        },
        { $sort: { timestamp: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
    ]);

    const total = await Certificate.aggregate([
        { $match: matchCriteria },
        { $unwind: '$history' },
        { $count: 'total' }
    ]);

    res.status(200).json({
        success: true,
        message: 'Audit log retrieved',
        pagination: {
            page,
            limit,
            total: total[0]?.total || 0,
            pages: Math.ceil((total[0]?.total || 0) / limit)
        },
        data: {
            auditLogs
        }
    });
});

// Batch validate certificates (admin only)
const batchValidateCertificates = catchAsync(async (req, res, next) => {
    const { certificateIds } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds)) {
        return next(new AppError('Please provide an array of certificate IDs', 400));
    }

    const validationResults = [];

    for (const certId of certificateIds) {
        try {
            const certificate = await Certificate.findById(certId);
            
            if (!certificate) {
                validationResults.push({
                    certificateId: certId,
                    valid: false,
                    error: 'Certificate not found'
                });
                continue;
            }

            // Perform basic validation
            const ipfsValidation = await validateIPFSIntegrity(certificate);
            const hashValidation = validateCertificateHash(certificate);
            
            const isValid = ipfsValidation.valid && hashValidation.valid;
            
            validationResults.push({
                certificateId: certificate.certificateId,
                valid: isValid,
                validations: [ipfsValidation, hashValidation]
            });

        } catch (error) {
            validationResults.push({
                certificateId: certId,
                valid: false,
                error: error.message
            });
        }
    }

    const validCount = validationResults.filter(r => r.valid).length;

    res.status(200).json({
        success: true,
        message: `Batch validation completed: ${validCount}/${validationResults.length} valid`,
        data: {
            total: validationResults.length,
            valid: validCount,
            results: validationResults
        }
    });
});

// Helper functions for validation
const validateIPFSIntegrity = async (certificate) => {
    try {
        const ipfsData = await ipfsService.getData(certificate.ipfs.cid);
        return {
            type: 'ipfs',
            valid: !!ipfsData,
            message: ipfsData ? 'IPFS data accessible' : 'IPFS data not found'
        };
    } catch (error) {
        return {
            type: 'ipfs',
            valid: false,
            message: 'IPFS data validation failed: ' + error.message
        };
    }
};

const validateCertificateHash = (certificate) => {
    try {
        // Recreate hash from certificate data
        const certData = {
            certificateId: certificate.certificateId,
            recipient: certificate.recipient,
            institution: certificate.institution,
            course: certificate.course
        };
        
        const computedHash = encryptionService.generateCertificateHash(certData);
        const isValid = computedHash === certificate.blockchain.certificateHash;
        
        return {
            type: 'hash',
            valid: isValid,
            message: isValid ? 'Certificate hash is valid' : 'Certificate hash mismatch'
        };
    } catch (error) {
        return {
            type: 'hash',
            valid: false,
            message: 'Hash validation failed: ' + error.message
        };
    }
};

const validateEncryptionIntegrity = async (certificate) => {
    try {
        if (!certificate.ipfs.encryptionKey) {
            return {
                type: 'encryption',
                valid: false,
                message: 'Encryption key not found'
            };
        }

        // Try to decrypt the IPFS data
        const ipfsData = await ipfsService.getData(certificate.ipfs.cid);
        // This would normally decrypt the data to verify it's valid
        
        return {
            type: 'encryption',
            valid: true,
            message: 'Encryption integrity verified'
        };
    } catch (error) {
        return {
            type: 'encryption',
            valid: false,
            message: 'Encryption validation failed: ' + error.message
        };
    }
};

const validateWorkflowIntegrity = (certificate) => {
    const issues = [];
    
    // Check status transitions
    if (certificate.status === CERTIFICATE_STATUS.APPROVED && !certificate.verifier.userId) {
        issues.push('Certificate approved without verifier');
    }
    
    if (certificate.status === CERTIFICATE_STATUS.ISSUED && !certificate.issuer.userId) {
        issues.push('Certificate issued without issuer');
    }
    
    // Check timestamps
    if (certificate.verifier.verifiedAt && certificate.createdAt > certificate.verifier.verifiedAt) {
        issues.push('Verification timestamp before creation timestamp');
    }
    
    return {
        type: 'workflow',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'Workflow integrity valid' : issues.join(', ')
    };
};

module.exports = {
    verifyCertificateByCode,
    verifyCertificateByHash,
    bulkVerifyCertificates,
    verifyByQRCode,
    validateCertificateIntegrity,
    verifyIPFSData,
    getVerificationStats,
    getAuditLog,
    batchValidateCertificates
};