const crypto = require('crypto');
const forge = require('node-forge');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
    }

    // Generate a random encryption key
    generateKey() {
        return crypto.randomBytes(this.keyLength);
    }

    // Generate a random IV (Initialization Vector)
    generateIV() {
        return crypto.randomBytes(this.ivLength);
    }

    // Generate a random salt for key derivation
    generateSalt() {
        return crypto.randomBytes(this.saltLength);
    }

    // Derive key from password using PBKDF2
    deriveKeyFromPassword(password, salt, iterations = 100000) {
        try {
            return crypto.pbkdf2Sync(password, salt, iterations, this.keyLength, 'sha256');
        } catch (error) {
            logger.error('Key derivation failed:', error);
            throw new AppError('Key derivation failed', 500);
        }
    }

    // Encrypt data using AES-256-GCM
    encrypt(data, key, additionalData = null) {
        try {
            // Generate random IV for each encryption
            const iv = this.generateIV();
            
            // Create cipher
            const cipher = crypto.createCipher(this.algorithm, key, { iv });
            
            // Add additional authenticated data if provided
            if (additionalData) {
                cipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }
            
            // Convert data to buffer if it's a string
            const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data), 'utf8');
            
            // Encrypt the data
            let encrypted = cipher.update(dataBuffer);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            // Get the authentication tag
            const tag = cipher.getAuthTag();
            
            // Return encrypted data with metadata
            const result = {
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                tag: tag.toString('base64'),
                algorithm: this.algorithm
            };
            
            if (additionalData) {
                result.aad = additionalData;
            }
            
            logger.debug('Data encrypted successfully');
            return result;
            
        } catch (error) {
            logger.error('Encryption failed:', error);
            throw new AppError('Encryption failed', 500);
        }
    }

    // Decrypt data using AES-256-GCM
    decrypt(encryptedData, key) {
        try {
            const { encrypted, iv, tag, aad } = encryptedData;
            
            // Create decipher
            const decipher = crypto.createDecipher(this.algorithm, key, { 
                iv: Buffer.from(iv, 'base64') 
            });
            
            // Set the authentication tag
            decipher.setAuthTag(Buffer.from(tag, 'base64'));
            
            // Set additional authenticated data if provided
            if (aad) {
                decipher.setAAD(Buffer.from(aad, 'utf8'));
            }
            
            // Decrypt the data
            let decrypted = decipher.update(Buffer.from(encrypted, 'base64'));
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            logger.debug('Data decrypted successfully');
            return decrypted;
            
        } catch (error) {
            logger.error('Decryption failed:', error);
            throw new AppError('Decryption failed - invalid key or corrupted data', 400);
        }
    }

    // Encrypt certificate data with password-based encryption
    encryptCertificate(certificateData, password) {
        try {
            // Generate salt and derive key from password
            const salt = this.generateSalt();
            const key = this.deriveKeyFromPassword(password, salt);
            
            // Prepare additional authenticated data (certificate metadata)
            const aad = JSON.stringify({
                certificateId: certificateData.certificateId,
                recipient: certificateData.recipient.name,
                institution: certificateData.institution.name,
                timestamp: new Date().toISOString()
            });
            
            // Encrypt the certificate data
            const encryptedResult = this.encrypt(certificateData, key, aad);
            
            return {
                ...encryptedResult,
                salt: salt.toString('base64'),
                iterations: 100000,
                keyDerivation: 'pbkdf2',
                hashFunction: 'sha256'
            };
            
        } catch (error) {
            logger.error('Certificate encryption failed:', error);
            throw new AppError('Certificate encryption failed', 500);
        }
    }

    // Decrypt certificate data with password
    decryptCertificate(encryptedCertificate, password) {
        try {
            const { salt, iterations, keyDerivation } = encryptedCertificate;
            
            // Derive key from password and salt
            const key = this.deriveKeyFromPassword(
                password, 
                Buffer.from(salt, 'base64'), 
                iterations || 100000
            );
            
            // Decrypt the certificate data
            const decryptedBuffer = this.decrypt(encryptedCertificate, key);
            const certificateData = JSON.parse(decryptedBuffer.toString('utf8'));
            
            return certificateData;
            
        } catch (error) {
            logger.error('Certificate decryption failed:', error);
            throw new AppError('Certificate decryption failed - invalid password', 400);
        }
    }

    // Generate RSA key pair for digital signatures
    generateKeyPair(keySize = 2048) {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: keySize,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            logger.info('RSA key pair generated successfully');
            return { publicKey, privateKey };
            
        } catch (error) {
            logger.error('Key pair generation failed:', error);
            throw new AppError('Key pair generation failed', 500);
        }
    }

    // Create digital signature for certificate
    signData(data, privateKey) {
        try {
            // Create hash of the data
            const dataHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
            
            // Create signature
            const signature = crypto.sign('sha256', dataHash, {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            });
            
            return signature.toString('base64');
            
        } catch (error) {
            logger.error('Digital signing failed:', error);
            throw new AppError('Digital signing failed', 500);
        }
    }

    // Verify digital signature
    verifySignature(data, signature, publicKey) {
        try {
            // Create hash of the data
            const dataHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
            
            // Verify signature
            const isValid = crypto.verify('sha256', dataHash, {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            }, Buffer.from(signature, 'base64'));
            
            return isValid;
            
        } catch (error) {
            logger.error('Signature verification failed:', error);
            throw new AppError('Signature verification failed', 500);
        }
    }

    // Generate certificate hash for blockchain storage
    generateCertificateHash(certificateData) {
        try {
            // Create a deterministic hash of certificate data
            const hashData = {
                certificateId: certificateData.certificateId,
                recipient: {
                    studentId: certificateData.recipient.studentId,
                    name: certificateData.recipient.name
                },
                institution: certificateData.institution.name,
                course: {
                    subject: certificateData.course.subject,
                    grade: certificateData.course.grade
                },
                completionDate: certificateData.course.completionDate
            };
            
            // Use Keccak256 hash (compatible with Ethereum)
            const keccak = require('keccak');
            const hash = keccak('keccak256').update(JSON.stringify(hashData)).digest();
            
            return '0x' + hash.toString('hex');
            
        } catch (error) {
            logger.error('Certificate hash generation failed:', error);
            throw new AppError('Certificate hash generation failed', 500);
        }
    }

    // Encrypt file buffer
    encryptFile(fileBuffer, password) {
        try {
            const salt = this.generateSalt();
            const key = this.deriveKeyFromPassword(password, salt);
            
            const encryptedResult = this.encrypt(fileBuffer, key);
            
            return {
                ...encryptedResult,
                salt: salt.toString('base64'),
                iterations: 100000
            };
            
        } catch (error) {
            logger.error('File encryption failed:', error);
            throw new AppError('File encryption failed', 500);
        }
    }

    // Decrypt file buffer
    decryptFile(encryptedFile, password) {
        try {
            const { salt, iterations } = encryptedFile;
            const key = this.deriveKeyFromPassword(
                password, 
                Buffer.from(salt, 'base64'), 
                iterations || 100000
            );
            
            return this.decrypt(encryptedFile, key);
            
        } catch (error) {
            logger.error('File decryption failed:', error);
            throw new AppError('File decryption failed', 400);
        }
    }

    // Generate secure random password
    generateSecurePassword(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        
        return password;
    }

    // Validate encryption key strength
    validateKeyStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const strength = {
            isValid: password.length >= minLength,
            length: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
            score: 0
        };
        
        // Calculate strength score
        if (strength.length) strength.score += 25;
        if (strength.hasUpperCase) strength.score += 20;
        if (strength.hasLowerCase) strength.score += 20;
        if (strength.hasNumbers) strength.score += 20;
        if (strength.hasSpecialChar) strength.score += 15;
        
        strength.level = strength.score >= 80 ? 'strong' : 
                        strength.score >= 60 ? 'medium' : 'weak';
        
        return strength;
    }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;