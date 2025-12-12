const pinataSDK = require('@pinata/sdk');
const { create } = require('ipfs-http-client');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class IPFSService {
    constructor() {
        this.pinata = null;
        this.ipfsClient = null;
        this.initialize();
    }

    // Initialize IPFS and Pinata connections
    async initialize() {
        try {
            // Initialize Pinata SDK
            if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
                this.pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
                
                // Test Pinata connection
                await this.testPinataConnection();
                logger.info('📌 Pinata IPFS service initialized successfully');
            } else {
                logger.warn('⚠️ Pinata credentials not found, using local IPFS node if available');
            }

            // Initialize local IPFS client as backup
            try {
                this.ipfsClient = create({ 
                    host: 'localhost', 
                    port: 5001, 
                    protocol: 'http' 
                });
                
                // Test IPFS connection
                await this.ipfsClient.version();
                logger.info('🌐 Local IPFS node connected successfully');
            } catch (error) {
                logger.warn('⚠️ Local IPFS node not available, using Pinata only');
            }

        } catch (error) {
            logger.error('❌ Failed to initialize IPFS service:', error);
        }
    }

    // Test Pinata connection
    async testPinataConnection() {
        if (!this.pinata) {
            throw new AppError('Pinata not initialized', 500);
        }

        try {
            await this.pinata.testAuthentication();
            return true;
        } catch (error) {
            logger.error('Pinata authentication failed:', error);
            throw new AppError('Pinata authentication failed', 500);
        }
    }

    // Upload JSON data to IPFS via Pinata
    async uploadJSON(jsonData, metadata = {}) {
        try {
            if (!this.pinata) {
                throw new AppError('IPFS service not available', 500);
            }

            const options = {
                pinataMetadata: {
                    name: metadata.name || `certificate-${Date.now()}`,
                    keyvalues: {
                        type: 'certificate',
                        timestamp: new Date().toISOString(),
                        ...metadata.keyvalues
                    }
                },
                pinataOptions: {
                    cidVersion: 1,
                    wrapWithDirectory: false
                }
            };

            const result = await this.pinata.pinJSONToIPFS(jsonData, options);
            
            logger.info(`📤 JSON uploaded to IPFS: ${result.IpfsHash}`);
            
            return {
                cid: result.IpfsHash,
                size: result.PinSize,
                timestamp: result.Timestamp,
                url: `${process.env.IPFS_GATEWAY_URL}${result.IpfsHash}`
            };

        } catch (error) {
            logger.error('Failed to upload JSON to IPFS:', error);
            throw new AppError('Failed to upload data to IPFS', 500);
        }
    }

    // Upload file to IPFS via Pinata
    async uploadFile(filePath, metadata = {}) {
        try {
            if (!this.pinata) {
                throw new AppError('IPFS service not available', 500);
            }

            // Check if file exists
            const fileStats = await fs.stat(filePath);
            if (!fileStats.isFile()) {
                throw new AppError('File not found', 404);
            }

            const readableStreamForFile = require('fs').createReadStream(filePath);
            const fileName = path.basename(filePath);

            const options = {
                pinataMetadata: {
                    name: metadata.name || fileName,
                    keyvalues: {
                        type: 'file',
                        originalName: fileName,
                        size: fileStats.size,
                        timestamp: new Date().toISOString(),
                        ...metadata.keyvalues
                    }
                },
                pinataOptions: {
                    cidVersion: 1
                }
            };

            const result = await this.pinata.pinFileToIPFS(readableStreamForFile, options);
            
            logger.info(`📤 File uploaded to IPFS: ${result.IpfsHash}`);
            
            return {
                cid: result.IpfsHash,
                size: result.PinSize,
                timestamp: result.Timestamp,
                url: `${process.env.IPFS_GATEWAY_URL}${result.IpfsHash}`,
                originalName: fileName
            };

        } catch (error) {
            logger.error('Failed to upload file to IPFS:', error);
            throw new AppError('Failed to upload file to IPFS', 500);
        }
    }

    // Upload buffer data to IPFS
    async uploadBuffer(buffer, fileName, metadata = {}) {
        try {
            if (!this.pinata) {
                throw new AppError('IPFS service not available', 500);
            }

            const options = {
                pinataMetadata: {
                    name: metadata.name || fileName,
                    keyvalues: {
                        type: 'buffer',
                        originalName: fileName,
                        size: buffer.length,
                        timestamp: new Date().toISOString(),
                        ...metadata.keyvalues
                    }
                },
                pinataOptions: {
                    cidVersion: 1
                }
            };

            const result = await this.pinata.pinFileToIPFS(buffer, options);
            
            logger.info(`📤 Buffer uploaded to IPFS: ${result.IpfsHash}`);
            
            return {
                cid: result.IpfsHash,
                size: result.PinSize,
                timestamp: result.Timestamp,
                url: `${process.env.IPFS_GATEWAY_URL}${result.IpfsHash}`,
                originalName: fileName
            };

        } catch (error) {
            logger.error('Failed to upload buffer to IPFS:', error);
            throw new AppError('Failed to upload buffer to IPFS', 500);
        }
    }

    // Retrieve data from IPFS
    async getData(cid) {
        try {
            const gatewayUrl = `${process.env.IPFS_GATEWAY_URL}${cid}`;
            
            // Use fetch to get data from IPFS gateway
            const fetch = require('node-fetch');
            const response = await fetch(gatewayUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            
            // Handle JSON data
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json();
                logger.info(`📥 JSON data retrieved from IPFS: ${cid}`);
                return { type: 'json', data: jsonData };
            }
            
            // Handle other file types
            const buffer = await response.buffer();
            logger.info(`📥 File retrieved from IPFS: ${cid}`);
            return { type: 'file', data: buffer, contentType };

        } catch (error) {
            logger.error(`Failed to retrieve data from IPFS (${cid}):`, error);
            throw new AppError('Failed to retrieve data from IPFS', 500);
        }
    }

    // Pin existing IPFS content
    async pinByCID(cid, metadata = {}) {
        try {
            if (!this.pinata) {
                throw new AppError('IPFS service not available', 500);
            }

            const options = {
                pinataMetadata: {
                    name: metadata.name || `pinned-${cid}`,
                    keyvalues: {
                        type: 'existing-content',
                        timestamp: new Date().toISOString(),
                        ...metadata.keyvalues
                    }
                }
            };

            const result = await this.pinata.pinByHash(cid, options);
            
            logger.info(`📌 Content pinned to IPFS: ${cid}`);
            return result;

        } catch (error) {
            logger.error(`Failed to pin content (${cid}):`, error);
            throw new AppError('Failed to pin content to IPFS', 500);
        }
    }

    // Unpin content from IPFS
    async unpinContent(cid) {
        try {
            if (!this.pinata) {
                throw new AppError('IPFS service not available', 500);
            }

            await this.pinata.unpin(cid);
            logger.info(`📌❌ Content unpinned from IPFS: ${cid}`);
            return true;

        } catch (error) {
            logger.error(`Failed to unpin content (${cid}):`, error);
            throw new AppError('Failed to unpin content from IPFS', 500);
        }
    }

    // List pinned content
    async listPinnedContent(filters = {}) {
        try {
            if (!this.pinata) {
                throw new AppError('IPFS service not available', 500);
            }

            const result = await this.pinata.pinList(filters);
            logger.info('📋 Retrieved pinned content list');
            return result;

        } catch (error) {
            logger.error('Failed to list pinned content:', error);
            throw new AppError('Failed to list pinned content', 500);
        }
    }

    // Get IPFS node status
    async getNodeStatus() {
        try {
            const status = {
                pinata: false,
                localNode: false,
                gatewayUrl: process.env.IPFS_GATEWAY_URL
            };

            // Check Pinata status
            if (this.pinata) {
                try {
                    await this.pinata.testAuthentication();
                    status.pinata = true;
                } catch (error) {
                    logger.warn('Pinata authentication failed');
                }
            }

            // Check local IPFS node status
            if (this.ipfsClient) {
                try {
                    await this.ipfsClient.version();
                    status.localNode = true;
                } catch (error) {
                    logger.warn('Local IPFS node unavailable');
                }
            }

            return status;

        } catch (error) {
            logger.error('Failed to get IPFS node status:', error);
            throw new AppError('Failed to get IPFS status', 500);
        }
    }

    // Generate IPFS hash for data without uploading
    async generateHash(data) {
        try {
            // Use IPFS CID library to generate hash
            const { CID } = require('multiformats/cid');
            const { sha256 } = require('multiformats/hashes/sha2');
            const { encode } = require('multiformats/codecs/dag-cbor');

            const serializedData = typeof data === 'string' ? 
                new TextEncoder().encode(data) : 
                encode(data);

            const hash = await sha256.digest(serializedData);
            const cid = CID.create(1, 0x70, hash); // dag-pb codec

            return cid.toString();

        } catch (error) {
            logger.error('Failed to generate IPFS hash:', error);
            throw new AppError('Failed to generate IPFS hash', 500);
        }
    }
}

// Create singleton instance
const ipfsService = new IPFSService();

module.exports = ipfsService;