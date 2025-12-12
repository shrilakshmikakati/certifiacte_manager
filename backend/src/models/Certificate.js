const mongoose = require('mongoose');

// Define certificate status
const CERTIFICATE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved', 
    REJECTED: 'rejected',
    ISSUED: 'issued',
    REVOKED: 'revoked'
};

// Define certificate types
const CERTIFICATE_TYPES = {
    ACADEMIC: 'academic',
    PROFESSIONAL: 'professional',
    TRAINING: 'training',
    ACHIEVEMENT: 'achievement'
};

const certificateSchema = new mongoose.Schema({
    // Unique identifier for the certificate
    certificateId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Certificate metadata
    title: {
        type: String,
        required: [true, 'Certificate title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    
    type: {
        type: String,
        enum: Object.values(CERTIFICATE_TYPES),
        required: [true, 'Certificate type is required']
    },
    
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Student/Recipient information
    recipient: {
        studentId: {
            type: String,
            required: [true, 'Student ID is required'],
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Recipient name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
        },
        walletAddress: {
            type: String,
            lowercase: true,
            match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid Ethereum wallet address']
        }
    },
    
    // Academic/Institution information
    institution: {
        name: {
            type: String,
            required: [true, 'Institution name is required'],
            trim: true,
            maxlength: [200, 'Institution name cannot exceed 200 characters']
        },
        department: {
            type: String,
            trim: true,
            maxlength: [100, 'Department cannot exceed 100 characters']
        },
        address: {
            type: String,
            trim: true,
            maxlength: [500, 'Address cannot exceed 500 characters']
        }
    },
    
    // Course/Subject information
    course: {
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
            maxlength: [100, 'Subject cannot exceed 100 characters']
        },
        grade: {
            type: String,
            trim: true,
            maxlength: [10, 'Grade cannot exceed 10 characters']
        },
        credits: {
            type: Number,
            min: [0, 'Credits cannot be negative']
        },
        duration: {
            type: String,
            trim: true
        },
        completionDate: {
            type: Date
        }
    },
    
    // Certificate workflow status
    status: {
        type: String,
        enum: Object.values(CERTIFICATE_STATUS),
        default: CERTIFICATE_STATUS.PENDING,
        required: true
    },
    
    // Workflow participants
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    
    verifier: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        comments: String
    },
    
    issuer: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        issuedAt: Date,
        comments: String
    },
    
    // Blockchain and IPFS data
    blockchain: {
        certificateHash: {
            type: String,
            required: [true, 'Certificate hash is required'],
            index: true
        },
        transactionHash: String,
        blockNumber: Number,
        contractAddress: String,
        tokenId: String, // For NFT certificates
        network: {
            type: String,
            default: 'Ganache'
        }
    },
    
    // IPFS storage information
    ipfs: {
        cid: {
            type: String,
            required: [true, 'IPFS CID is required'],
            index: true
        },
        gateway: {
            type: String,
            default: 'https://gateway.pinata.cloud/ipfs/'
        },
        encryptionKey: {
            type: String,
            select: false // Don't include in queries by default
        },
        isEncrypted: {
            type: Boolean,
            default: true
        }
    },
    
    // File information
    files: {
        originalCsv: {
            filename: String,
            size: Number,
            mimetype: String,
            uploadedAt: Date
        },
        certificatePdf: {
            filename: String,
            size: Number,
            generatedAt: Date,
            cid: String // Separate IPFS CID for PDF
        }
    },
    
    // Verification and security
    verification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        verificationCode: {
            type: String,
            unique: true,
            sparse: true
        },
        qrCode: String, // Base64 encoded QR code
        publicKey: String,
        signature: String
    },
    
    // Additional metadata
    metadata: {
        batchId: String, // For batch uploads
        templateId: String,
        customFields: mongoose.Schema.Types.Mixed,
        tags: [String]
    },
    
    // Audit trail
    history: [{
        action: {
            type: String,
            required: true,
            enum: ['created', 'verified', 'approved', 'rejected', 'issued', 'revoked', 'updated']
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String,
        previousStatus: String,
        newStatus: String
    }]
    
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.ipfs.encryptionKey; // Remove sensitive data
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes for performance
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ 'recipient.studentId': 1 });
certificateSchema.index({ 'recipient.name': 1 });
certificateSchema.index({ 'blockchain.certificateHash': 1 });
certificateSchema.index({ 'ipfs.cid': 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ creator: 1 });
certificateSchema.index({ createdAt: -1 });
certificateSchema.index({ 'course.subject': 1 });
certificateSchema.index({ 'institution.name': 1 });

// Virtual for certificate URL
certificateSchema.virtual('certificateUrl').get(function() {
    if (this.ipfs && this.ipfs.cid) {
        return `${this.ipfs.gateway}${this.ipfs.cid}`;
    }
    return null;
});

// Virtual for verification URL
certificateSchema.virtual('verificationUrl').get(function() {
    if (this.verification && this.verification.verificationCode) {
        return `${process.env.FRONTEND_URL}/verify/${this.verification.verificationCode}`;
    }
    return null;
});

// Pre-save middleware to generate certificate ID
certificateSchema.pre('save', function(next) {
    if (!this.certificateId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();
    }
    next();
});

// Pre-save middleware to generate verification code
certificateSchema.pre('save', function(next) {
    if (!this.verification.verificationCode && this.status === CERTIFICATE_STATUS.ISSUED) {
        const crypto = require('crypto');
        this.verification.verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();
    }
    next();
});

// Method to add history entry
certificateSchema.methods.addHistoryEntry = function(action, performedBy, details = '') {
    const previousStatus = this.status;
    
    this.history.push({
        action,
        performedBy,
        details,
        previousStatus,
        newStatus: this.status,
        timestamp: new Date()
    });
    
    return this.save();
};

// Static method to find by verification code
certificateSchema.statics.findByVerificationCode = function(code) {
    return this.findOne({ 
        'verification.verificationCode': code.toUpperCase(),
        status: CERTIFICATE_STATUS.ISSUED 
    }).populate('creator verifier.userId issuer.userId', 'username email profile.firstName profile.lastName');
};

// Static method to find certificates by status
certificateSchema.statics.findByStatus = function(status, populateFields = '') {
    return this.find({ status }).populate(populateFields).sort({ createdAt: -1 });
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = {
    Certificate,
    CERTIFICATE_STATUS,
    CERTIFICATE_TYPES
};