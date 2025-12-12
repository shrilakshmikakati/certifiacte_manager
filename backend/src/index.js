try {
    console.log('Loading modules...');
    
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const dotenv = require('dotenv');
    const path = require('path');

    console.log('Basic modules loaded successfully');

    // Load environment variables
    dotenv.config();

    console.log('Environment variables loaded');

    // Import configuration and middleware
    const connectDB = require('./config/database');
    console.log('Database config loaded');
    
    const logger = require('./utils/logger');
    console.log('Logger loaded');
    
    const { errorHandler } = require('./middleware/errorHandler');
    console.log('Error handler loaded');

// Import routes
const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificates');
const uploadRoutes = require('./routes/upload');
const verificationRoutes = require('./routes/verification');
const blockchainRoutes = require('./routes/blockchain');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Certificate Manager API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Handle favicon and manifest requests (return 204 No Content)
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.get('/manifest.json', (req, res) => {
    res.status(204).end();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/blockchain', blockchainRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        console.log('Starting server...');
        
        // Connect to database (make it optional for testing)
        try {
            await connectDB();
            logger.info('📊 MongoDB connected successfully');
        } catch (error) {
            logger.warn('⚠️  MongoDB connection failed, running without database:', error.message);
            logger.info('📝 Note: User authentication will not work without MongoDB');
        }
        
        console.log(`Attempting to start server on port ${PORT}...`);
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Certificate Manager API server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            
            logger.info(`🚀 Certificate Manager API server running on port ${PORT}`);
            logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

    // Initialize server
    startServer();

    module.exports = app;

} catch (error) {
    console.error('Failed to load modules or start server:', error);
    process.exit(1);
}