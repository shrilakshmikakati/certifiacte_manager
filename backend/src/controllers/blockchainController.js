const { AppError, catchAsync } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchainService');
const { Certificate } = require('../models/Certificate');
const logger = require('../utils/logger');

// Deploy contract (admin only)
const deployContract = catchAsync(async (req, res, next) => {
    // This would typically be handled by deployment scripts
    // For now, return contract deployment information
    
    res.status(200).json({
        success: true,
        message: 'Contract deployment should be handled by deployment scripts',
        data: {
            contractAddress: process.env.CONTRACT_ADDRESS,
            network: process.env.NODE_ENV === 'production' ? 'zkSync Era Mainnet' : 'zkSync Era Testnet'
        }
    });
});

// Get contract information
const getContractInfo = catchAsync(async (req, res, next) => {
    try {
        const networkStatus = await blockchainService.getNetworkStatus();
        
        const contractInfo = {
            address: process.env.CONTRACT_ADDRESS,
            network: networkStatus.network,
            connected: networkStatus.connected,
            blockNumber: networkStatus.blockNumber,
            walletAddress: blockchainService.wallet?.address,
            walletBalance: networkStatus.balance
        };

        res.status(200).json({
            success: true,
            message: 'Contract information retrieved',
            data: contractInfo
        });

    } catch (error) {
        logger.error('Failed to get contract info:', error);
        return next(new AppError('Failed to retrieve contract information', 500));
    }
});

// Anchor certificate to blockchain
const anchorCertificate = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    // Check if already anchored
    if (certificate.blockchain.transactionHash) {
        return res.status(200).json({
            success: true,
            message: 'Certificate already anchored to blockchain',
            data: {
                certificateId: certificate.certificateId,
                transactionHash: certificate.blockchain.transactionHash,
                blockNumber: certificate.blockchain.blockNumber
            }
        });
    }

    try {
        // Create certificate on blockchain
        const blockchainResult = await blockchainService.createCertificateOnChain(
            certificate.blockchain.certificateHash,
            certificate.ipfs.cid,
            {
                certificateId: certificate.certificateId,
                recipient: certificate.recipient.name,
                institution: certificate.institution.name,
                subject: certificate.course.subject
            }
        );

        // Update certificate with blockchain information
        certificate.blockchain.transactionHash = blockchainResult.transactionHash;
        certificate.blockchain.blockNumber = blockchainResult.blockNumber;
        certificate.blockchain.contractAddress = process.env.CONTRACT_ADDRESS;

        await certificate.save();

        // Add to history
        await certificate.addHistoryEntry(
            'anchored', 
            req.user._id, 
            `Anchored to blockchain: ${blockchainResult.transactionHash}`
        );

        logger.info(`Certificate anchored to blockchain: ${certificate.certificateId}, TX: ${blockchainResult.transactionHash}`);

        res.status(200).json({
            success: true,
            message: 'Certificate anchored to blockchain successfully',
            data: {
                certificateId: certificate.certificateId,
                blockchainResult
            }
        });

    } catch (error) {
        logger.error('Failed to anchor certificate:', error);
        return next(new AppError('Failed to anchor certificate to blockchain', 500));
    }
});

// Get certificate blockchain information
const getCertificateBlockchainInfo = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
        return next(new AppError('Certificate not found', 404));
    }

    try {
        const blockchainInfo = {
            certificateHash: certificate.blockchain.certificateHash,
            transactionHash: certificate.blockchain.transactionHash,
            blockNumber: certificate.blockchain.blockNumber,
            contractAddress: certificate.blockchain.contractAddress,
            network: certificate.blockchain.network,
            isAnchored: !!certificate.blockchain.transactionHash
        };

        // If anchored, get additional blockchain data
        if (blockchainInfo.isAnchored) {
            try {
                const txInfo = await blockchainService.getTransactionInfo(certificate.blockchain.transactionHash);
                blockchainInfo.transactionInfo = txInfo;

                // Verify hash exists on chain
                const hashVerification = await blockchainService.verifyHashOnChain(certificate.blockchain.certificateHash);
                blockchainInfo.hashVerification = hashVerification;

            } catch (error) {
                logger.warn('Failed to get additional blockchain info:', error);
                blockchainInfo.warning = 'Could not retrieve complete blockchain information';
            }
        }

        res.status(200).json({
            success: true,
            message: 'Certificate blockchain information retrieved',
            data: blockchainInfo
        });

    } catch (error) {
        logger.error('Failed to get certificate blockchain info:', error);
        return next(new AppError('Failed to retrieve blockchain information', 500));
    }
});

// Batch anchor certificates
const batchAnchorCertificates = catchAsync(async (req, res, next) => {
    const { certificateIds } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds)) {
        return next(new AppError('Please provide an array of certificate IDs', 400));
    }

    const results = [];
    const errors = [];

    for (const certId of certificateIds) {
        try {
            const certificate = await Certificate.findById(certId);
            
            if (!certificate) {
                errors.push({
                    certificateId: certId,
                    error: 'Certificate not found'
                });
                continue;
            }

            if (certificate.blockchain.transactionHash) {
                results.push({
                    certificateId: certificate.certificateId,
                    status: 'already_anchored',
                    transactionHash: certificate.blockchain.transactionHash
                });
                continue;
            }

            // Anchor to blockchain
            const blockchainResult = await blockchainService.createCertificateOnChain(
                certificate.blockchain.certificateHash,
                certificate.ipfs.cid,
                {
                    certificateId: certificate.certificateId,
                    recipient: certificate.recipient.name,
                    institution: certificate.institution.name
                }
            );

            // Update certificate
            certificate.blockchain.transactionHash = blockchainResult.transactionHash;
            certificate.blockchain.blockNumber = blockchainResult.blockNumber;
            await certificate.save();

            results.push({
                certificateId: certificate.certificateId,
                status: 'anchored',
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber
            });

        } catch (error) {
            errors.push({
                certificateId: certId,
                error: error.message
            });
        }
    }

    logger.info(`Batch anchoring completed by ${req.user.email}: ${results.length} anchored, ${errors.length} failed`);

    res.status(200).json({
        success: true,
        message: `Batch anchoring completed: ${results.length}/${certificateIds.length} successful`,
        data: {
            total: certificateIds.length,
            anchored: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

// Verify hash on blockchain
const verifyHashOnBlockchain = catchAsync(async (req, res, next) => {
    const { hash } = req.params;

    if (!hash) {
        return next(new AppError('Certificate hash is required', 400));
    }

    try {
        const verification = await blockchainService.verifyHashOnChain(hash);
        
        res.status(200).json({
            success: true,
            message: 'Hash verification completed',
            data: verification
        });

    } catch (error) {
        logger.error('Failed to verify hash on blockchain:', error);
        return next(new AppError('Hash verification failed', 500));
    }
});

// Get transaction information
const getTransactionInfo = catchAsync(async (req, res, next) => {
    const { txHash } = req.params;

    if (!txHash) {
        return next(new AppError('Transaction hash is required', 400));
    }

    try {
        const txInfo = await blockchainService.getTransactionInfo(txHash);
        
        res.status(200).json({
            success: true,
            message: 'Transaction information retrieved',
            data: txInfo
        });

    } catch (error) {
        logger.error('Failed to get transaction info:', error);
        return next(new AppError('Failed to retrieve transaction information', 500));
    }
});

// Get network status
const getNetworkStatus = catchAsync(async (req, res, next) => {
    try {
        const status = await blockchainService.getNetworkStatus();
        
        res.status(200).json({
            success: true,
            message: 'Network status retrieved',
            data: status
        });

    } catch (error) {
        logger.error('Failed to get network status:', error);
        return next(new AppError('Failed to retrieve network status', 500));
    }
});

// Get contract statistics
const getContractStats = catchAsync(async (req, res, next) => {
    try {
        const stats = {
            contractAddress: process.env.CONTRACT_ADDRESS,
            totalCertificatesInDB: await Certificate.countDocuments(),
            anchoredCertificates: await Certificate.countDocuments({
                'blockchain.transactionHash': { $exists: true, $ne: null }
            }),
            pendingAnchoring: await Certificate.countDocuments({
                'blockchain.transactionHash': { $exists: false }
            })
        };

        // Get network status
        const networkStatus = await blockchainService.getNetworkStatus();
        stats.network = networkStatus;

        res.status(200).json({
            success: true,
            message: 'Contract statistics retrieved',
            data: stats
        });

    } catch (error) {
        logger.error('Failed to get contract stats:', error);
        return next(new AppError('Failed to retrieve contract statistics', 500));
    }
});

// Estimate gas fees
const estimateGasFees = catchAsync(async (req, res, next) => {
    const { operation, ...args } = req.body;

    if (!operation) {
        return next(new AppError('Operation type is required', 400));
    }

    try {
        const gasEstimation = await blockchainService.estimateGas(operation, ...Object.values(args));
        
        res.status(200).json({
            success: true,
            message: 'Gas estimation completed',
            data: {
                operation,
                ...gasEstimation
            }
        });

    } catch (error) {
        logger.error('Failed to estimate gas:', error);
        return next(new AppError('Gas estimation failed', 500));
    }
});

// Get current gas prices
const getCurrentGasPrices = catchAsync(async (req, res, next) => {
    try {
        const gasPrices = await blockchainService.getCurrentGasPrices();
        
        res.status(200).json({
            success: true,
            message: 'Gas prices retrieved',
            data: gasPrices
        });

    } catch (error) {
        logger.error('Failed to get gas prices:', error);
        return next(new AppError('Failed to retrieve gas prices', 500));
    }
});

module.exports = {
    deployContract,
    getContractInfo,
    anchorCertificate,
    getCertificateBlockchainInfo,
    batchAnchorCertificates,
    verifyHashOnBlockchain,
    getTransactionInfo,
    getNetworkStatus,
    getContractStats,
    estimateGasFees,
    getCurrentGasPrices
};