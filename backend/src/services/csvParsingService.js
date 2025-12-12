const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');
const Joi = require('joi');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class CSVParsingService {
    constructor() {
        // Define validation schema for certificate data
        this.certificateSchema = Joi.object({
            studentId: Joi.string().required().trim().min(1).max(50),
            name: Joi.string().required().trim().min(2).max(100),
            email: Joi.string().email().optional().allow(''),
            institution: Joi.string().required().trim().min(2).max(200),
            department: Joi.string().optional().allow('').trim().max(100),
            subject: Joi.string().required().trim().min(2).max(100),
            grade: Joi.string().optional().allow('').trim().max(10),
            credits: Joi.number().optional().min(0).max(999),
            completionDate: Joi.date().optional(),
            certificateType: Joi.string().optional().valid('academic', 'professional', 'training', 'achievement').default('academic'),
            duration: Joi.string().optional().allow('').trim().max(50),
            walletAddress: Joi.string().optional().regex(/^0x[a-fA-F0-9]{40}$/).allow('')
        });

        // Supported file types
        this.supportedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
    }

    // Validate file type
    validateFileType(file) {
        const mimeType = file.mimetype;
        const extension = path.extname(file.originalname).toLowerCase();
        
        const isValidMimeType = this.supportedTypes.includes(mimeType);
        const isValidExtension = ['.csv', '.xls', '.xlsx'].includes(extension);
        
        if (!isValidMimeType && !isValidExtension) {
            throw new AppError(
                'Invalid file type. Please upload CSV or Excel files only.',
                400
            );
        }
        
        return true;
    }

    // Parse CSV file from buffer
    async parseCSVFromBuffer(buffer, filename) {
        try {
            logger.info(`Starting CSV parsing for file: ${filename}`);
            
            const results = [];
            const errors = [];
            let rowIndex = 0;
            
            return new Promise((resolve, reject) => {
                const stream = Readable.from(buffer.toString());
                
                stream
                    .pipe(csv({
                        skipEmptyLines: true,
                        headers: true,
                        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_')
                    }))
                    .on('data', (data) => {
                        rowIndex++;
                        
                        try {
                            // Normalize and validate row data
                            const normalizedData = this.normalizeRowData(data, rowIndex);
                            const validatedData = this.validateRowData(normalizedData, rowIndex);
                            
                            results.push({
                                rowIndex,
                                data: validatedData,
                                isValid: true
                            });
                            
                        } catch (error) {
                            errors.push({
                                rowIndex,
                                data,
                                error: error.message,
                                isValid: false
                            });
                        }
                    })
                    .on('end', () => {
                        logger.info(`CSV parsing completed. Processed ${rowIndex} rows`);
                        resolve({
                            totalRows: rowIndex,
                            validRows: results.length,
                            invalidRows: errors.length,
                            results,
                            errors,
                            filename
                        });
                    })
                    .on('error', (error) => {
                        logger.error('CSV parsing failed:', error);
                        reject(new AppError('Failed to parse CSV file', 400));
                    });
            });
            
        } catch (error) {
            logger.error('CSV buffer parsing failed:', error);
            throw new AppError('Failed to parse CSV buffer', 400);
        }
    }

    // Parse Excel file from buffer
    async parseExcelFromBuffer(buffer, filename) {
        try {
            logger.info(`Starting Excel parsing for file: ${filename}`);
            
            // Read workbook from buffer
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            
            // Get first worksheet
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                throw new AppError('Excel file has no worksheets', 400);
            }
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                blankrows: false
            });
            
            if (jsonData.length === 0) {
                throw new AppError('Excel file is empty', 400);
            }
            
            // Get headers from first row
            const headers = jsonData[0].map(header => 
                String(header).trim().toLowerCase().replace(/\s+/g, '_')
            );
            
            const results = [];
            const errors = [];
            
            // Process data rows (skip header row)
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                const rowIndex = i + 1; // +1 to account for header row
                
                try {
                    // Create row object from headers and values
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index] || '';
                    });
                    
                    // Skip empty rows
                    if (this.isEmptyRow(rowData)) {
                        continue;
                    }
                    
                    // Normalize and validate row data
                    const normalizedData = this.normalizeRowData(rowData, rowIndex);
                    const validatedData = this.validateRowData(normalizedData, rowIndex);
                    
                    results.push({
                        rowIndex,
                        data: validatedData,
                        isValid: true
                    });
                    
                } catch (error) {
                    errors.push({
                        rowIndex,
                        data: row,
                        error: error.message,
                        isValid: false
                    });
                }
            }
            
            logger.info(`Excel parsing completed. Processed ${jsonData.length - 1} rows`);
            
            return {
                totalRows: jsonData.length - 1, // Exclude header row
                validRows: results.length,
                invalidRows: errors.length,
                results,
                errors,
                filename,
                sheetName
            };
            
        } catch (error) {
            logger.error('Excel parsing failed:', error);
            throw new AppError('Failed to parse Excel file', 400);
        }
    }

    // Parse file based on type
    async parseFile(file) {
        try {
            // Validate file type
            this.validateFileType(file);
            
            const extension = path.extname(file.originalname).toLowerCase();
            const buffer = file.buffer;
            
            let parseResult;
            
            if (extension === '.csv') {
                parseResult = await this.parseCSVFromBuffer(buffer, file.originalname);
            } else if (['.xls', '.xlsx'].includes(extension)) {
                parseResult = await this.parseExcelFromBuffer(buffer, file.originalname);
            } else {
                throw new AppError('Unsupported file format', 400);
            }
            
            // Add file metadata
            parseResult.fileInfo = {
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            
            return parseResult;
            
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('File parsing failed:', error);
            throw new AppError('Failed to parse uploaded file', 400);
        }
    }

    // Normalize row data (map common field variations)
    normalizeRowData(rowData, rowIndex) {
        const normalized = {};
        
        // Field mapping for common variations
        const fieldMappings = {
            studentId: ['student_id', 'studentid', 'student_number', 'id', 'roll_no', 'roll_number'],
            name: ['student_name', 'full_name', 'name', 'student'],
            email: ['email', 'email_address', 'student_email'],
            institution: ['institution', 'school', 'college', 'university', 'institute'],
            department: ['department', 'dept', 'faculty', 'school_department'],
            subject: ['subject', 'course', 'course_name', 'subject_name', 'module'],
            grade: ['grade', 'marks', 'score', 'result', 'cgpa', 'gpa'],
            credits: ['credits', 'credit_hours', 'units', 'credit_points'],
            completionDate: ['completion_date', 'date_completed', 'graduation_date', 'date'],
            certificateType: ['certificate_type', 'type', 'category'],
            duration: ['duration', 'course_duration', 'period'],
            walletAddress: ['wallet_address', 'wallet', 'ethereum_address', 'address']
        };
        
        // Normalize field names
        for (const [standardField, variations] of Object.entries(fieldMappings)) {
            let value = '';
            
            // Check for exact match first
            if (rowData[standardField] !== undefined) {
                value = rowData[standardField];
            } else {
                // Check variations
                for (const variation of variations) {
                    if (rowData[variation] !== undefined) {
                        value = rowData[variation];
                        break;
                    }
                }
            }
            
            // Clean and set value
            normalized[standardField] = this.cleanValue(value);
        }
        
        // Handle date parsing
        if (normalized.completionDate) {
            normalized.completionDate = this.parseDate(normalized.completionDate);
        }
        
        // Handle numeric fields
        if (normalized.credits) {
            const credits = parseFloat(normalized.credits);
            normalized.credits = isNaN(credits) ? undefined : credits;
        }
        
        return normalized;
    }

    // Clean and trim values
    cleanValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        
        return String(value).trim().replace(/\s+/g, ' ');
    }

    // Parse date from various formats
    parseDate(dateString) {
        if (!dateString) return undefined;
        
        const cleanDate = String(dateString).trim();
        
        // Try parsing different date formats
        const dateFormats = [
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY or DD-MM-YYYY
        ];
        
        const parsedDate = new Date(cleanDate);
        
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }
        
        return undefined;
    }

    // Validate individual row data
    validateRowData(rowData, rowIndex) {
        const { error, value } = this.certificateSchema.validate(rowData, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
        
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join('; ');
            throw new Error(`Row ${rowIndex}: ${errorMessage}`);
        }
        
        return value;
    }

    // Check if row is empty
    isEmptyRow(rowData) {
        const values = Object.values(rowData).map(v => String(v).trim());
        return values.every(v => v === '' || v === null || v === undefined);
    }

    // Generate sample CSV template
    generateSampleCSV() {
        const headers = [
            'studentId',
            'name', 
            'email',
            'institution',
            'department',
            'subject',
            'grade',
            'credits',
            'completionDate',
            'certificateType',
            'duration',
            'walletAddress'
        ];
        
        const sampleData = [
            [
                'STU001',
                'John Doe',
                'john.doe@email.com',
                'Tech University',
                'Computer Science',
                'Web Development',
                'A+',
                '3',
                '2024-12-01',
                'academic',
                '4 months',
                '0x742d35Cc6634C0532925a3b8D34C0000d0619ce'
            ],
            [
                'STU002',
                'Jane Smith',
                'jane.smith@email.com',
                'Tech University',
                'Computer Science',
                'Database Systems',
                'A',
                '4',
                '2024-11-15',
                'academic',
                '3 months',
                ''
            ]
        ];
        
        const csvContent = [headers, ...sampleData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        return csvContent;
    }

    // Validate CSV headers
    validateHeaders(headers) {
        const requiredHeaders = ['studentId', 'name', 'institution', 'subject'];
        const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, '_'));
        
        const missingHeaders = [];
        
        for (const required of requiredHeaders) {
            const found = normalizedHeaders.some(header => {
                const fieldMappings = {
                    studentId: ['student_id', 'studentid', 'student_number', 'id'],
                    name: ['student_name', 'full_name', 'name'],
                    institution: ['institution', 'school', 'college', 'university'],
                    subject: ['subject', 'course', 'course_name', 'subject_name']
                };
                
                return [required, ...(fieldMappings[required] || [])].includes(header);
            });
            
            if (!found) {
                missingHeaders.push(required);
            }
        }
        
        if (missingHeaders.length > 0) {
            throw new AppError(
                `Missing required headers: ${missingHeaders.join(', ')}. Please ensure your file includes these columns.`,
                400
            );
        }
        
        return true;
    }
}

// Create singleton instance
const csvParsingService = new CSVParsingService();

module.exports = csvParsingService;