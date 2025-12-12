const express = require('express');
const { authenticate, restrictTo } = require('../middleware/auth');
const blockchainController = require('../controllers/blockchainController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Blockchain interaction routes
router.post('/deploy-contract', restrictTo('admin'), blockchainController.deployContract);
router.get('/contract-info', blockchainController.getContractInfo);

// Certificate blockchain operations
router.post('/certificates/:id/anchor', blockchainController.anchorCertificate);
router.get('/certificates/:id/blockchain-info', blockchainController.getCertificateBlockchainInfo);

// Batch blockchain operations
router.post('/batch/anchor', restrictTo('admin'), blockchainController.batchAnchorCertificates);

// Blockchain verification
router.get('/verify-hash/:hash', blockchainController.verifyHashOnBlockchain);
router.get('/transaction/:txHash', blockchainController.getTransactionInfo);

// Network and contract status
router.get('/network-status', blockchainController.getNetworkStatus);
router.get('/contract-stats', restrictTo('admin'), blockchainController.getContractStats);

// Gas estimation and fee management
router.post('/estimate-gas', blockchainController.estimateGasFees);
router.get('/gas-prices', blockchainController.getCurrentGasPrices);

module.exports = router;