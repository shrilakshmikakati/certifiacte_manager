const { User, USER_ROLES } = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Sign JWT token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Create and send JWT token
const createSendToken = (user, statusCode, res, message = 'Success') => {
    const token = signToken(user._id);
    
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        message,
        token,
        data: {
            user
        }
    });
};

// Register new user
const register = catchAsync(async (req, res, next) => {
    const { username, email, password, role, walletAddress, profile } = req.body;

    // Validate required fields
    if (!username || !email || !password || !walletAddress || !profile) {
        return next(new AppError('Please provide all required fields', 400));
    }

    // Validate role
    const allowedRoles = Object.values(USER_ROLES);
    if (role && !allowedRoles.includes(role)) {
        return next(new AppError('Invalid user role', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [
            { email },
            { username },
            { walletAddress: walletAddress.toLowerCase() }
        ]
    });

    if (existingUser) {
        return next(new AppError('User with this email, username, or wallet address already exists', 400));
    }

    // Create new user
    const newUser = await User.create({
        username,
        email,
        password,
        role: role || USER_ROLES.CREATOR,
        walletAddress: walletAddress.toLowerCase(),
        profile,
        permissions: getDefaultPermissions(role || USER_ROLES.CREATOR)
    });

    logger.info(`New user registered: ${email} (${newUser.role})`);

    createSendToken(newUser, 201, res, 'User registered successfully');
});

// Login user
const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // Check if user exists and password is correct
    const user = await User.findByCredentials(email, password);

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);

    createSendToken(user, 200, res, 'Login successful');
});

// Wallet-based login
const walletLogin = catchAsync(async (req, res, next) => {
    // User is already set by validateWalletSignature middleware
    const user = req.user;

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`Wallet login: ${user.walletAddress}`);

    createSendToken(user, 200, res, 'Wallet login successful');
});

// Get current user
const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate({
        path: 'permissions',
        select: 'name description'
    });

    res.status(200).json({
        success: true,
        data: {
            user
        }
    });
});

// Update current user data
const updateMe = catchAsync(async (req, res, next) => {
    // Fields that can be updated by user
    const allowedFields = ['profile', 'email'];
    const filteredBody = {};

    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredBody[key] = req.body[key];
        }
    });

    // Don't allow updating sensitive fields
    if (req.body.password || req.body.role || req.body.walletAddress) {
        return next(new AppError('This route is not for updating password, role, or wallet address', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    logger.info(`User updated profile: ${updatedUser.email}`);

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: updatedUser
        }
    });
});

// Update password
const updatePassword = catchAsync(async (req, res, next) => {
    const { passwordCurrent, password, passwordConfirm } = req.body;

    if (!passwordCurrent || !password || !passwordConfirm) {
        return next(new AppError('Please provide current password, new password, and confirmation', 400));
    }

    if (password !== passwordConfirm) {
        return next(new AppError('Password confirmation does not match', 400));
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    if (!(await user.correctPassword(passwordCurrent))) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = password;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);

    createSendToken(user, 200, res, 'Password updated successfully');
});

// Logout user
const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Forgot password
const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Please provide email address', 400));
    }

    // Get user based on posted email
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
        return next(new AppError('There is no user with that email address', 404));
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    logger.info(`Password reset requested for: ${email}`);

    // In production, send email with reset link
    // For now, return token in response (remove in production)
    res.status(200).json({
        success: true,
        message: 'Password reset token sent to email',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
});

// Reset password
const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
        return next(new AppError('Please provide password and confirmation', 400));
    }

    if (password !== passwordConfirm) {
        return next(new AppError('Password confirmation does not match', 400));
    }

    // Get user based on token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
        isActive: true
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    logger.info(`Password reset completed for: ${user.email}`);

    createSendToken(user, 200, res, 'Password reset successful');
});

// Admin: Get all users
const getAllUsers = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const status = req.query.status;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    // Get users with pagination
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
        success: true,
        results: users.length,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        data: {
            users
        }
    });
});

// Admin: Update user role
const updateUserRole = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(USER_ROLES).includes(role)) {
        return next(new AppError('Please provide a valid role', 400));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.role = role;
    user.permissions = getDefaultPermissions(role);
    await user.save();

    logger.info(`User role updated: ${user.email} -> ${role} by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
            user
        }
    });
});

// Admin: Update user status
const updateUserStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return next(new AppError('Please provide valid status (true/false)', 400));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`User status updated: ${user.email} -> ${isActive ? 'active' : 'inactive'} by ${req.user.email}`);

    res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: {
            user
        }
    });
});

// Helper function to get default permissions based on role
const getDefaultPermissions = (role) => {
    const permissionMap = {
        [USER_ROLES.CREATOR]: ['create_certificates'],
        [USER_ROLES.VERIFIER]: ['verify_certificates', 'view_all_certificates'],
        [USER_ROLES.ISSUER]: ['issue_certificates', 'view_all_certificates'],
        [USER_ROLES.ADMIN]: [
            'create_certificates',
            'verify_certificates', 
            'issue_certificates',
            'view_all_certificates',
            'manage_users',
            'system_admin'
        ]
    };

    return permissionMap[role] || [];
};

module.exports = {
    register,
    login,
    walletLogin,
    getMe,
    updateMe,
    updatePassword,
    logout,
    forgotPassword,
    resetPassword,
    getAllUsers,
    updateUserRole,
    updateUserStatus
};