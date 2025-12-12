const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Define user roles
const USER_ROLES = {
    CREATOR: 'creator',
    VERIFIER: 'verifier',
    ISSUER: 'issuer',
    ADMIN: 'admin'
};

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.CREATOR,
        required: true
    },
    walletAddress: {
        type: String,
        required: [true, 'Wallet address is required'],
        unique: true,
        lowercase: true,
        match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid Ethereum wallet address']
    },
    profile: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        organization: {
            type: String,
            trim: true,
            maxlength: [100, 'Organization name cannot exceed 100 characters']
        },
        department: {
            type: String,
            trim: true,
            maxlength: [100, 'Department name cannot exceed 100 characters']
        },
        phoneNumber: {
            type: String,
            trim: true,
            match: [/^\+?[\d\s\-\(\)]{10,15}$/, 'Please provide a valid phone number']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    permissions: [{
        type: String,
        enum: [
            'create_certificates',
            'verify_certificates', 
            'issue_certificates',
            'view_all_certificates',
            'manage_users',
            'system_admin'
        ]
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash the password with cost of 12
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

// Update lastLogin on save
userSchema.pre('save', function(next) {
    if (!this.isNew && this.isModified('lastLogin')) {
        this.lastLogin = new Date();
    }
    next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role,
        walletAddress: this.walletAddress
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email, isActive: true }).select('+password');
    
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    
    const isMatch = await user.correctPassword(password);
    if (!isMatch) {
        throw new Error('Invalid login credentials');
    }
    
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = {
    User,
    USER_ROLES
};