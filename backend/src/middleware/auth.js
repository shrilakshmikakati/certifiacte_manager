const jwt = require('jsonwebtoken');
const { User, USER_ROLES } = require('../models/User');
const { AppError, catchAsync } = require('./errorHandler');
const logger = require('../utils/logger');

// Middleware to protect routes - verify JWT token
const authenticate = catchAsync(async (req, res, next) => {
    // 1) Check if token exists
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    
    try {
        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id).select('+password');
        if (!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }
        
        // 4) Check if user is active
        if (!currentUser.isActive) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 401));
        }
        
        // 5) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password! Please log in again.', 401));
        }
        
        // 6) Grant access to protected route
        req.user = currentUser;
        
        // Log successful authentication
        logger.info(`User authenticated: ${currentUser.email} (${currentUser.role})`);
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again!', 401));
        } else if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        return next(error);
    }
});

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }
        
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        
        next();
    };
};

// Middleware to check specific permissions
const requirePermissions = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }
        
        const hasPermission = permissions.every(permission => 
            req.user.permissions.includes(permission)
        );
        
        if (!hasPermission) {
            return next(new AppError('Insufficient permissions to perform this action', 403));
        }
        
        next();
    };
};

// Middleware to check if user owns the resource or has admin role
const checkOwnership = (resourceUserField = 'creator') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }
        
        // Admin and system users can access any resource
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }
        
        // Check if the resource belongs to the user
        const resourceUserId = req.resource ? req.resource[resourceUserField] : null;
        
        if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
            return next(new AppError('You can only access your own resources', 403));
        }
        
        next();
    };
};

// Middleware to validate wallet signature (for Web3 authentication)
const validateWalletSignature = catchAsync(async (req, res, next) => {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
        return next(new AppError('Wallet address, signature, and message are required', 400));
    }
    
    try {
        const ethers = require('ethers');
        
        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return next(new AppError('Invalid wallet signature', 401));
        }
        
        // Check if user exists with this wallet address
        const user = await User.findOne({ 
            walletAddress: walletAddress.toLowerCase(),
            isActive: true 
        });
        
        if (!user) {
            return next(new AppError('No account found with this wallet address', 404));
        }
        
        req.user = user;
        next();
        
    } catch (error) {
        logger.error('Wallet signature validation error:', error);
        return next(new AppError('Failed to validate wallet signature', 400));
    }
});

// Middleware to rate limit authentication attempts
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const key = req.ip + (req.body.email || req.body.walletAddress || '');
        const now = Date.now();
        
        if (!attempts.has(key)) {
            attempts.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const attemptData = attempts.get(key);
        
        if (now > attemptData.resetTime) {
            attempts.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        if (attemptData.count >= maxAttempts) {
            return next(new AppError(`Too many authentication attempts. Please try again later.`, 429));
        }
        
        attemptData.count++;
        next();
    };
};

// Middleware to log authentication events
const logAuthEvents = (event) => {
    return (req, res, next) => {
        const user = req.user || { email: req.body.email || 'unknown' };
        const ip = req.ip || req.connection.remoteAddress;
        
        logger.info(`Auth Event: ${event}`, {
            user: user.email,
            ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
        });
        
        next();
    };
};

// Optional: Middleware for API key authentication (for service-to-service calls)
const authenticateApiKey = catchAsync(async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return next(new AppError('API key is required', 401));
    }
    
    // In production, store API keys in database with proper hashing
    const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
        return next(new AppError('Invalid API key', 401));
    }
    
    // Set a service user context
    req.user = {
        _id: 'service',
        role: 'service',
        email: 'service@system',
        isService: true
    };
    
    next();
});

module.exports = {
    authenticate,
    restrictTo,
    requirePermissions,
    checkOwnership,
    validateWalletSignature,
    authRateLimit,
    logAuthEvents,
    authenticateApiKey
};