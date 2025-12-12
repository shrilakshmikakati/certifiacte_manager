const { ethers } = require('ethers');
const { Wallet, Provider, Contract } = require('zksync-web3');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// Contract ABI - simplified for key functions
const CERTIFICATE_REGISTRY_ABI = [
    "function createCertificate(bytes32 _certificateHash, string calldata _ipfsCID, string calldata _metadata) external returns (uint256)",
    "function verifyCertificate(uint256 _certificateId, bool _approved) external",
    "function issueCertificate(uint256 _certificateId) external",
    "function revokeCertificate(uint256 _certificateId, string calldata _reason) external",
    "function getCertificate(uint256 _certificateId) external view returns (tuple(bytes32 certificateHash, string ipfsCID, uint8 status, address creator, address verifier, address issuer, uint256 createdAt, uint256 verifiedAt, uint256 issuedAt, string metadata))",
    "function getCertificateIdByHash(bytes32 _certificateHash) external view returns (uint256)",
    "function verifyCertificateHash(bytes32 _certificateHash) external view returns (bool)",
    "function getTotalCertificates() external view returns (uint256)",
    "function hasRole(bytes32 role, address account) external view returns (bool)",
    "function CREATOR_ROLE() external view returns (bytes32)",
    "function VERIFIER_ROLE() external view returns (bytes32)",
    "function ISSUER_ROLE() external view returns (bytes32)",
    "event CertificateCreated(uint256 indexed certificateId, bytes32 indexed certificateHash, string ipfsCID, address indexed creator)",
    "event CertificateVerified(uint256 indexed certificateId, address indexed verifier, uint8 status)",
    "event CertificateIssued(uint256 indexed certificateId, address indexed issuer)"
];

class BlockchainService {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        this.initialize();
    }

    // Initialize blockchain connection
    async initialize() {
        try {
            // Initialize provider
            const rpcUrl = process.env.NODE_ENV === 'production' 
                ? process.env.ZKSYNC_RPC_URL 
                : process.env.ZKSYNC_TESTNET_RPC_URL;

            if (!rpcUrl) {
                logger.warn('⚠️ zkSync RPC URL not configured');
                return;
            }

            this.provider = new Provider(rpcUrl);
            
            // Initialize wallet if private key is provided
            if (process.env.PRIVATE_KEY) {
                this.wallet = new Wallet(process.env.PRIVATE_KEY, this.provider);
                logger.info(`🔗 Blockchain wallet connected: ${this.wallet.address}`);
            }

            // Initialize contract if address is provided
            if (this.contractAddress && this.wallet) {
                this.contract = new Contract(this.contractAddress, CERTIFICATE_REGISTRY_ABI, this.wallet);
                logger.info(`📄 Certificate Registry contract connected: ${this.contractAddress}`);
            }

            // Test connection
            await this.testConnection();

        } catch (error) {
            logger.error('❌ Failed to initialize blockchain service:', error);
        }
    }

    // Test blockchain connection
    async testConnection() {
        try {
            if (this.provider) {
                const network = await this.provider.getNetwork();
                logger.info(`🌐 Connected to zkSync network: ${network.name} (Chain ID: ${network.chainId})`);
            }

            if (this.contract) {
                const totalCerts = await this.contract.getTotalCertificates();
                logger.info(`📊 Total certificates on chain: ${totalCerts.toString()}`);
            }

            return true;
        } catch (error) {
            logger.error('Blockchain connection test failed:', error);
            return false;
        }
    }

    // Create certificate on blockchain
    async createCertificateOnChain(certificateHash, ipfsCID, metadata) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            logger.info(`Creating certificate on blockchain: ${certificateHash}`);

            // Estimate gas
            const gasEstimate = await this.contract.estimateGas.createCertificate(
                certificateHash,
                ipfsCID,
                JSON.stringify(metadata)
            );

            // Create transaction with gas limit
            const tx = await this.contract.createCertificate(
                certificateHash,
                ipfsCID,
                JSON.stringify(metadata),
                { gasLimit: gasEstimate.mul(120).div(100) } // 20% buffer
            );

            logger.info(`Transaction sent: ${tx.hash}`);

            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            // Extract certificate ID from events
            const event = receipt.events?.find(e => e.event === 'CertificateCreated');
            const certificateId = event?.args?.certificateId?.toNumber();

            logger.info(`Certificate created on blockchain: ID ${certificateId}, Hash: ${tx.hash}`);

            return {
                certificateId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status
            };

        } catch (error) {
            logger.error('Failed to create certificate on blockchain:', error);
            throw new AppError('Blockchain transaction failed: ' + error.message, 500);
        }
    }

    // Verify certificate on blockchain
    async verifyCertificateOnChain(certificateId, approved) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            logger.info(`Verifying certificate on blockchain: ${certificateId}, approved: ${approved}`);

            const tx = await this.contract.verifyCertificate(certificateId, approved);
            const receipt = await tx.wait();

            logger.info(`Certificate verified on blockchain: ${tx.hash}`);

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status
            };

        } catch (error) {
            logger.error('Failed to verify certificate on blockchain:', error);
            throw new AppError('Blockchain verification failed: ' + error.message, 500);
        }
    }

    // Issue certificate on blockchain
    async issueCertificateOnChain(certificateId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            logger.info(`Issuing certificate on blockchain: ${certificateId}`);

            const tx = await this.contract.issueCertificate(certificateId);
            const receipt = await tx.wait();

            logger.info(`Certificate issued on blockchain: ${tx.hash}`);

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status
            };

        } catch (error) {
            logger.error('Failed to issue certificate on blockchain:', error);
            throw new AppError('Blockchain issuance failed: ' + error.message, 500);
        }
    }

    // Revoke certificate on blockchain
    async revokeCertificateOnChain(certificateId, reason) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            logger.info(`Revoking certificate on blockchain: ${certificateId}`);

            const tx = await this.contract.revokeCertificate(certificateId, reason);
            const receipt = await tx.wait();

            logger.info(`Certificate revoked on blockchain: ${tx.hash}`);

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status
            };

        } catch (error) {
            logger.error('Failed to revoke certificate on blockchain:', error);
            throw new AppError('Blockchain revocation failed: ' + error.message, 500);
        }
    }

    // Get certificate from blockchain
    async getCertificateFromChain(certificateId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const cert = await this.contract.getCertificate(certificateId);
            
            return {
                certificateHash: cert.certificateHash,
                ipfsCID: cert.ipfsCID,
                status: cert.status,
                creator: cert.creator,
                verifier: cert.verifier,
                issuer: cert.issuer,
                createdAt: new Date(cert.createdAt.toNumber() * 1000),
                verifiedAt: cert.verifiedAt.toNumber() > 0 ? new Date(cert.verifiedAt.toNumber() * 1000) : null,
                issuedAt: cert.issuedAt.toNumber() > 0 ? new Date(cert.issuedAt.toNumber() * 1000) : null,
                metadata: cert.metadata
            };

        } catch (error) {
            logger.error('Failed to get certificate from blockchain:', error);
            throw new AppError('Failed to retrieve certificate from blockchain', 500);
        }
    }

    // Verify certificate hash exists on blockchain
    async verifyHashOnChain(certificateHash) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const isValid = await this.contract.verifyCertificateHash(certificateHash);
            
            return {
                hash: certificateHash,
                exists: isValid,
                verified: isValid
            };

        } catch (error) {
            logger.error('Failed to verify hash on blockchain:', error);
            return {
                hash: certificateHash,
                exists: false,
                verified: false,
                error: error.message
            };
        }
    }

    // Get transaction information
    async getTransactionInfo(txHash) {
        try {
            if (!this.provider) {
                throw new Error('Provider not initialized');
            }

            const tx = await this.provider.getTransaction(txHash);
            const receipt = await this.provider.getTransactionReceipt(txHash);

            return {
                hash: txHash,
                from: tx.from,
                to: tx.to,
                value: tx.value.toString(),
                gasPrice: tx.gasPrice?.toString(),
                gasLimit: tx.gasLimit?.toString(),
                gasUsed: receipt?.gasUsed?.toString(),
                blockNumber: tx.blockNumber,
                confirmations: tx.confirmations,
                status: receipt?.status,
                timestamp: tx.timestamp ? new Date(tx.timestamp * 1000) : null
            };

        } catch (error) {
            logger.error('Failed to get transaction info:', error);
            throw new AppError('Failed to retrieve transaction information', 500);
        }
    }

    // Get network status
    async getNetworkStatus() {
        try {
            const status = {
                connected: false,
                network: null,
                blockNumber: null,
                gasPrice: null,
                balance: null
            };

            if (this.provider) {
                const network = await this.provider.getNetwork();
                const blockNumber = await this.provider.getBlockNumber();
                const gasPrice = await this.provider.getGasPrice();

                status.connected = true;
                status.network = {
                    name: network.name,
                    chainId: network.chainId
                };
                status.blockNumber = blockNumber;
                status.gasPrice = gasPrice.toString();

                if (this.wallet) {
                    const balance = await this.wallet.getBalance();
                    status.balance = ethers.utils.formatEther(balance);
                }
            }

            return status;

        } catch (error) {
            logger.error('Failed to get network status:', error);
            return {
                connected: false,
                error: error.message
            };
        }
    }

    // Estimate gas fees
    async estimateGas(operation, ...args) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            let gasEstimate;
            
            switch (operation) {
                case 'createCertificate':
                    gasEstimate = await this.contract.estimateGas.createCertificate(...args);
                    break;
                case 'verifyCertificate':
                    gasEstimate = await this.contract.estimateGas.verifyCertificate(...args);
                    break;
                case 'issueCertificate':
                    gasEstimate = await this.contract.estimateGas.issueCertificate(...args);
                    break;
                default:
                    throw new Error('Unsupported operation');
            }

            const gasPrice = await this.provider.getGasPrice();
            const estimatedCost = gasEstimate.mul(gasPrice);

            return {
                gasLimit: gasEstimate.toString(),
                gasPrice: gasPrice.toString(),
                estimatedCost: estimatedCost.toString(),
                estimatedCostEth: ethers.utils.formatEther(estimatedCost)
            };

        } catch (error) {
            logger.error('Failed to estimate gas:', error);
            throw new AppError('Gas estimation failed: ' + error.message, 500);
        }
    }

    // Check if address has role
    async hasRole(role, address) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // Get role hash
            let roleHash;
            switch (role.toLowerCase()) {
                case 'creator':
                    roleHash = await this.contract.CREATOR_ROLE();
                    break;
                case 'verifier':
                    roleHash = await this.contract.VERIFIER_ROLE();
                    break;
                case 'issuer':
                    roleHash = await this.contract.ISSUER_ROLE();
                    break;
                default:
                    throw new Error('Invalid role');
            }

            return await this.contract.hasRole(roleHash, address);

        } catch (error) {
            logger.error('Failed to check role:', error);
            return false;
        }
    }

    // Get current gas prices
    async getCurrentGasPrices() {
        try {
            if (!this.provider) {
                throw new Error('Provider not initialized');
            }

            const gasPrice = await this.provider.getGasPrice();
            
            return {
                standard: gasPrice.toString(),
                fast: gasPrice.mul(110).div(100).toString(), // 10% higher
                fastest: gasPrice.mul(120).div(100).toString(), // 20% higher
                unit: 'wei'
            };

        } catch (error) {
            logger.error('Failed to get gas prices:', error);
            throw new AppError('Failed to retrieve gas prices', 500);
        }
    }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;