const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, requirePermissions } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for processing

const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
        files: 5 // Maximum 5 files per upload
    }
});

// All routes require authentication
router.use(authenticate);

// File upload routes
router.post(
    '/csv',
    requirePermissions('create_certificates'),
    upload.single('csvFile'),
    uploadController.uploadCSV
);

router.post(
    '/excel',
    requirePermissions('create_certificates'),
    upload.single('excelFile'),
    uploadController.uploadExcel
);

router.post(
    '/batch',
    requirePermissions('create_certificates'),
    upload.array('files', 5),
    uploadController.uploadBatchFiles
);

// Template and sample file routes
router.get('/template/csv', uploadController.downloadCSVTemplate);
router.get('/template/sample', uploadController.downloadSampleCSV);

// File validation routes
router.post(
    '/validate',
    requirePermissions('create_certificates'),
    upload.single('file'),
    uploadController.validateFile
);

// Upload status and history
router.get('/history', uploadController.getUploadHistory);
router.get('/status/:uploadId', uploadController.getUploadStatus);

module.exports = router;