const { AppError, catchAsync } = require('../middleware/errorHandler');
const csvParsingService = require('../services/csvParsingService');
const { Certificate } = require('../models/Certificate');
const logger = require('../utils/logger');
const encryptionService = require('../utils/encryption');
const ipfsService = require('../services/ipfsService');
const path = require('path');

// Upload and parse CSV file
const uploadCSV = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload a CSV file', 400));
    }

    try {
        // Parse the CSV file
        const parseResult = await csvParsingService.parseFile(req.file);
        
        // Create upload session for tracking
        const uploadSession = {
            uploadId: generateUploadId(),
            fileName: req.file.originalname,
            fileSize: req.file.size,
            totalRows: parseResult.totalRows,
            validRows: parseResult.validRows,
            invalidRows: parseResult.invalidRows,
            uploadedBy: req.user._id,
            uploadedAt: new Date(),
            status: 'processed',
            parseResult
        };

        // Store upload session in database (you might want to create an Upload model)
        // For now, we'll return the results directly

        logger.info(`CSV uploaded and parsed: ${req.file.originalname} by ${req.user.email}, ${parseResult.validRows} valid rows`);

        res.status(200).json({
            success: true,
            message: 'CSV file processed successfully',
            data: {
                uploadId: uploadSession.uploadId,
                summary: {
                    fileName: req.file.originalname,
                    totalRows: parseResult.totalRows,
                    validRows: parseResult.validRows,
                    invalidRows: parseResult.invalidRows
                },
                validData: parseResult.results,
                errors: parseResult.errors,
                canProceed: parseResult.validRows > 0
            }
        });

    } catch (error) {
        logger.error('CSV upload failed:', error);
        return next(new AppError('Failed to process CSV file', 400));
    }
});

// Upload and parse Excel file
const uploadExcel = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload an Excel file', 400));
    }

    try {
        // Parse the Excel file
        const parseResult = await csvParsingService.parseFile(req.file);
        
        const uploadSession = {
            uploadId: generateUploadId(),
            fileName: req.file.originalname,
            fileSize: req.file.size,
            totalRows: parseResult.totalRows,
            validRows: parseResult.validRows,
            invalidRows: parseResult.invalidRows,
            uploadedBy: req.user._id,
            uploadedAt: new Date(),
            status: 'processed',
            parseResult
        };

        logger.info(`Excel uploaded and parsed: ${req.file.originalname} by ${req.user.email}, ${parseResult.validRows} valid rows`);

        res.status(200).json({
            success: true,
            message: 'Excel file processed successfully',
            data: {
                uploadId: uploadSession.uploadId,
                summary: {
                    fileName: req.file.originalname,
                    totalRows: parseResult.totalRows,
                    validRows: parseResult.validRows,
                    invalidRows: parseResult.invalidRows,
                    sheetName: parseResult.sheetName
                },
                validData: parseResult.results,
                errors: parseResult.errors,
                canProceed: parseResult.validRows > 0
            }
        });

    } catch (error) {
        logger.error('Excel upload failed:', error);
        return next(new AppError('Failed to process Excel file', 400));
    }
});

// Upload multiple files in batch
const uploadBatchFiles = catchAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(new AppError('Please upload at least one file', 400));
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        try {
            const parseResult = await csvParsingService.parseFile(file);
            
            results.push({
                fileName: file.originalname,
                uploadId: generateUploadId(),
                summary: {
                    totalRows: parseResult.totalRows,
                    validRows: parseResult.validRows,
                    invalidRows: parseResult.invalidRows
                },
                validData: parseResult.results,
                errors: parseResult.errors
            });
            
        } catch (error) {
            errors.push({
                fileName: file.originalname,
                error: error.message
            });
        }
    }

    const totalValidRows = results.reduce((sum, result) => sum + result.summary.validRows, 0);

    logger.info(`Batch upload completed by ${req.user.email}: ${results.length} files processed, ${totalValidRows} valid rows`);

    res.status(200).json({
        success: true,
        message: 'Batch file upload completed',
        data: {
            processedFiles: results.length,
            failedFiles: errors.length,
            totalValidRows,
            results,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

// Create certificates from uploaded data
const createCertificatesFromUpload = catchAsync(async (req, res, next) => {
    const { uploadData, batchId } = req.body;

    if (!uploadData || !Array.isArray(uploadData)) {
        return next(new AppError('Invalid upload data provided', 400));
    }

    const createdCertificates = [];
    const failedCertificates = [];

    for (let i = 0; i < uploadData.length; i++) {
        const certData = uploadData[i];
        
        try {
            // Transform upload data to certificate format
            const certificateData = {
                title: `Certificate - ${certData.subject}`,
                type: certData.certificateType || 'academic',
                recipient: {
                    studentId: certData.studentId,
                    name: certData.name,
                    email: certData.email,
                    walletAddress: certData.walletAddress
                },
                institution: {
                    name: certData.institution,
                    department: certData.department
                },
                course: {
                    subject: certData.subject,
                    grade: certData.grade,
                    credits: certData.credits,
                    duration: certData.duration,
                    completionDate: certData.completionDate
                },
                metadata: {
                    batchId: batchId || generateBatchId(),
                    uploadIndex: i,
                    source: 'csv_upload'
                }
            };

            // Generate certificate hash
            const certificateHash = encryptionService.generateCertificateHash(certificateData);

            // Encrypt certificate data
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
                    creator: req.user.email,
                    batchId: batchId || generateBatchId()
                }
            });

            // Create certificate record
            const certificate = await Certificate.create({
                ...certificateData,
                creator: req.user._id,
                blockchain: {
                    certificateHash,
                    network: 'Ganache'
                },
                ipfs: {
                    cid: ipfsResult.cid,
                    encryptionKey: encryptionPassword,
                    isEncrypted: true
                }
            });

            await certificate.addHistoryEntry('created', req.user._id, 'Certificate created from upload');

            createdCertificates.push({
                certificateId: certificate.certificateId,
                studentId: certData.studentId,
                name: certData.name,
                subject: certData.subject
            });

        } catch (error) {
            failedCertificates.push({
                index: i,
                studentId: certData.studentId,
                name: certData.name,
                error: error.message
            });
        }
    }

    logger.info(`Certificates created from upload by ${req.user.email}: ${createdCertificates.length} created, ${failedCertificates.length} failed`);

    res.status(200).json({
        success: true,
        message: 'Certificates created from upload data',
        data: {
            created: createdCertificates.length,
            failed: failedCertificates.length,
            batchId: batchId || generateBatchId(),
            certificates: createdCertificates,
            errors: failedCertificates.length > 0 ? failedCertificates : undefined
        }
    });
});

// Download CSV template
const downloadCSVTemplate = catchAsync(async (req, res, next) => {
    const csvTemplate = csvParsingService.generateSampleCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate_template.csv"');
    
    res.status(200).send(csvTemplate);
});

// Download sample CSV with data
const downloadSampleCSV = catchAsync(async (req, res, next) => {
    const sampleData = csvParsingService.generateSampleCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="certificate_sample.csv"');
    
    res.status(200).send(sampleData);
});

// Validate file without processing
const validateFile = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload a file for validation', 400));
    }

    try {
        // Validate file type
        csvParsingService.validateFileType(req.file);
        
        // Quick validation - just check headers and first few rows
        const parseResult = await csvParsingService.parseFile(req.file);
        
        // Return validation results without storing data
        const validation = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            isValid: parseResult.validRows > 0,
            totalRows: parseResult.totalRows,
            validRows: parseResult.validRows,
            invalidRows: parseResult.invalidRows,
            sampleErrors: parseResult.errors.slice(0, 5), // Show first 5 errors
            recommendations: generateValidationRecommendations(parseResult)
        };

        res.status(200).json({
            success: true,
            message: 'File validation completed',
            data: validation
        });

    } catch (error) {
        logger.error('File validation failed:', error);
        return next(new AppError('File validation failed: ' + error.message, 400));
    }
});

// Get upload history for user
const getUploadHistory = catchAsync(async (req, res, next) => {
    // This would query an Upload model if implemented
    // For now, return placeholder data
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Placeholder implementation
    const history = [];
    
    res.status(200).json({
        success: true,
        message: 'Upload history retrieved',
        pagination: {
            page,
            limit,
            total: history.length,
            pages: Math.ceil(history.length / limit)
        },
        data: {
            uploads: history
        }
    });
});

// Get upload status by ID
const getUploadStatus = catchAsync(async (req, res, next) => {
    const { uploadId } = req.params;
    
    // This would query an Upload model if implemented
    // For now, return placeholder data
    
    const status = {
        uploadId,
        status: 'completed',
        message: 'Upload processing completed'
    };
    
    res.status(200).json({
        success: true,
        data: status
    });
});

// Helper functions
const generateUploadId = () => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateBatchId = () => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateValidationRecommendations = (parseResult) => {
    const recommendations = [];
    
    if (parseResult.invalidRows > 0) {
        recommendations.push('Fix validation errors before proceeding with certificate creation');
    }
    
    if (parseResult.validRows === 0) {
        recommendations.push('No valid data found. Please check your file format and required fields');
    }
    
    if (parseResult.errors.some(e => e.error.includes('email'))) {
        recommendations.push('Ensure email addresses are in valid format');
    }
    
    if (parseResult.errors.some(e => e.error.includes('date'))) {
        recommendations.push('Use YYYY-MM-DD format for dates');
    }
    
    return recommendations;
};

module.exports = {
    uploadCSV,
    uploadExcel,
    uploadBatchFiles,
    createCertificatesFromUpload,
    downloadCSVTemplate,
    downloadSampleCSV,
    validateFile,
    getUploadHistory,
    getUploadStatus
};