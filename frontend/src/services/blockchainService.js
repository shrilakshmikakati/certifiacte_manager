import { ethers } from 'ethers';
import { apiRequest, endpoints } from './api';
import toast from 'react-hot-toast';

// Contract ABI (simplified version - you'll need the full ABI from your compiled contract)
const CERTIFICATE_REGISTRY_ABI = [
  // View functions
  "function getCertificate(uint256 tokenId) view returns (tuple(address creator, address verifier, address issuer, string ipfsHash, uint8 status, uint256 createdAt, uint256 updatedAt))",
  "function certificateExists(uint256 tokenId) view returns (bool)",
  "function getCertificateStatus(uint256 tokenId) view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  
  // State changing functions
  "function createCertificate(uint256 tokenId, address verifier, string calldata ipfsHash) external",
  "function verifyCertificate(uint256 tokenId) external",
  "function issueCertificate(uint256 tokenId) external",
  "function revokeCertificate(uint256 tokenId) external",
  
  // Role management
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  
  // Events
  "event CertificateCreated(uint256 indexed tokenId, address indexed creator, string ipfsHash)",
  "event CertificateVerified(uint256 indexed tokenId, address indexed verifier)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed issuer)",
  "event CertificateRevoked(uint256 indexed tokenId, address indexed issuer)",
];

// Contract address (you'll need to set this after deployment)
const CONTRACT_ADDRESS = process.env.REACT_APP_CERTIFICATE_REGISTRY_ADDRESS || '0x...';

// Ganache network configuration
const GANACHE_NETWORK = {
  chainId: 1337, // Ganache local
  name: 'Ganache Local',
  rpcUrl: process.env.REACT_APP_GANACHE_URL || 'http://127.0.0.1:7545',
  blockExplorer: null,
};

// Certificate status enum
export const CertificateStatus = {
  DRAFT: 0,
  PENDING_VERIFICATION: 1,
  VERIFIED: 2,
  ISSUED: 3,
  REVOKED: 4,
};

// Role hashes (these should match your smart contract)
export const Roles = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  CREATOR_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('CREATOR_ROLE')),
  VERIFIER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('VERIFIER_ROLE')),
  ISSUER_ROLE: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ISSUER_ROLE')),
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  // Initialize providers
  async initialize(web3Provider, web3Signer) {
    try {
      this.provider = web3Provider;
      this.signer = web3Signer;
      
      // Create contract instance
      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x...') {
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CERTIFICATE_REGISTRY_ABI,
          this.signer
        );
      }
      
      return true;
    } catch (error) {
      console.error('Blockchain service initialization error:', error);
      throw error;
    }
  }

  // Get contract instance
  getContract(signer = null) {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x...') {
      throw new Error('Contract address not configured');
    }
    
    const contractSigner = signer || this.signer;
    if (!contractSigner) {
      throw new Error('No signer available');
    }
    
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CERTIFICATE_REGISTRY_ABI,
      contractSigner
    );
  }

  // Create certificate on blockchain
  async createCertificate(certificateId, verifierAddress, ipfsHash) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Convert certificate ID to uint256
      const tokenId = ethers.BigNumber.from(certificateId);

      // Estimate gas
      const gasEstimate = await this.contract.estimateGas.createCertificate(
        tokenId,
        verifierAddress,
        ipfsHash
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate.mul(120).div(100);

      // Execute transaction
      const tx = await this.contract.createCertificate(
        tokenId,
        verifierAddress,
        ipfsHash,
        { gasLimit }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Create certificate blockchain error:', error);
      throw this.handleContractError(error);
    }
  }

  // Verify certificate on blockchain
  async verifyCertificate(certificateId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenId = ethers.BigNumber.from(certificateId);

      // Check if certificate exists
      const exists = await this.contract.certificateExists(tokenId);
      if (!exists) {
        throw new Error('Certificate not found on blockchain');
      }

      // Estimate gas
      const gasEstimate = await this.contract.estimateGas.verifyCertificate(tokenId);
      const gasLimit = gasEstimate.mul(120).div(100);

      // Execute transaction
      const tx = await this.contract.verifyCertificate(tokenId, { gasLimit });
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Verify certificate blockchain error:', error);
      throw this.handleContractError(error);
    }
  }

  // Issue certificate on blockchain
  async issueCertificate(certificateId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenId = ethers.BigNumber.from(certificateId);

      // Check if certificate exists and is verified
      const certificate = await this.getCertificate(certificateId);
      if (certificate.status !== CertificateStatus.VERIFIED) {
        throw new Error('Certificate must be verified before issuing');
      }

      // Estimate gas
      const gasEstimate = await this.contract.estimateGas.issueCertificate(tokenId);
      const gasLimit = gasEstimate.mul(120).div(100);

      // Execute transaction
      const tx = await this.contract.issueCertificate(tokenId, { gasLimit });
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Issue certificate blockchain error:', error);
      throw this.handleContractError(error);
    }
  }

  // Revoke certificate on blockchain
  async revokeCertificate(certificateId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenId = ethers.BigNumber.from(certificateId);

      // Estimate gas
      const gasEstimate = await this.contract.estimateGas.revokeCertificate(tokenId);
      const gasLimit = gasEstimate.mul(120).div(100);

      // Execute transaction
      const tx = await this.contract.revokeCertificate(tokenId, { gasLimit });
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Revoke certificate blockchain error:', error);
      throw this.handleContractError(error);
    }
  }

  // Get certificate from blockchain
  async getCertificate(certificateId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenId = ethers.BigNumber.from(certificateId);

      // Check if certificate exists
      const exists = await this.contract.certificateExists(tokenId);
      if (!exists) {
        throw new Error('Certificate not found on blockchain');
      }

      // Get certificate data
      const certificateData = await this.contract.getCertificate(tokenId);

      return {
        creator: certificateData.creator,
        verifier: certificateData.verifier,
        issuer: certificateData.issuer,
        ipfsHash: certificateData.ipfsHash,
        status: certificateData.status,
        createdAt: new Date(certificateData.createdAt.toNumber() * 1000),
        updatedAt: new Date(certificateData.updatedAt.toNumber() * 1000),
      };
    } catch (error) {
      console.error('Get certificate blockchain error:', error);
      throw this.handleContractError(error);
    }
  }

  // Check if certificate exists on blockchain
  async certificateExists(certificateId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenId = ethers.BigNumber.from(certificateId);
      return await this.contract.certificateExists(tokenId);
    } catch (error) {
      console.error('Certificate exists check error:', error);
      return false;
    }
  }

  // Get certificate status from blockchain
  async getCertificateStatus(certificateId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenId = ethers.BigNumber.from(certificateId);
      const status = await this.contract.getCertificateStatus(tokenId);
      return status;
    } catch (error) {
      console.error('Get certificate status error:', error);
      throw this.handleContractError(error);
    }
  }

  // Get total number of certificates
  async getTotalSupply() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const totalSupply = await this.contract.totalSupply();
      return totalSupply.toNumber();
    } catch (error) {
      console.error('Get total supply error:', error);
      throw this.handleContractError(error);
    }
  }

  // Check if address has specific role
  async hasRole(roleHash, address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      return await this.contract.hasRole(roleHash, address);
    } catch (error) {
      console.error('Has role check error:', error);
      return false;
    }
  }

  // Get transaction details
  async getTransaction(transactionHash) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const tx = await this.provider.getTransaction(transactionHash);
      const receipt = await this.provider.getTransactionReceipt(transactionHash);

      return {
        transaction: tx,
        receipt: receipt,
        confirmations: receipt ? receipt.confirmations : 0,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
      };
    } catch (error) {
      console.error('Get transaction error:', error);
      throw error;
    }
  }

  // Get current gas price
  async getGasPrice() {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const gasPrice = await this.provider.getGasPrice();
      return ethers.utils.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.error('Get gas price error:', error);
      throw error;
    }
  }

  // Get account balance
  async getBalance(address) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Handle contract errors
  handleContractError(error) {
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return new Error('Transaction would fail. Please check your inputs and try again.');
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new Error('Insufficient funds to complete the transaction.');
    }
    
    if (error.code === 'USER_REJECTED') {
      return new Error('Transaction was rejected by user.');
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return new Error('Network error. Please check your connection and try again.');
    }
    
    if (error.message?.includes('execution reverted')) {
      const reason = error.message.split('execution reverted: ')[1] || 'Transaction failed';
      return new Error(reason);
    }
    
    return new Error(error.message || 'Blockchain transaction failed');
  }

  // Format status for display
  formatStatus(status) {
    const statusNames = {
      [CertificateStatus.DRAFT]: 'Draft',
      [CertificateStatus.PENDING_VERIFICATION]: 'Pending Verification',
      [CertificateStatus.VERIFIED]: 'Verified',
      [CertificateStatus.ISSUED]: 'Issued',
      [CertificateStatus.REVOKED]: 'Revoked',
    };
    
    return statusNames[status] || 'Unknown';
  }

  // Get block explorer URL
  getBlockExplorerUrl(transactionHash) {
    // Ganache doesn't have a block explorer, return null or a local URL
    return GANACHE_NETWORK.blockExplorer 
      ? `${GANACHE_NETWORK.blockExplorer}/tx/${transactionHash}` 
      : null;
  }

  // Sync blockchain data with backend
  async syncWithBackend(certificateId, transactionHash) {
    try {
      const response = await apiRequest.post(endpoints.blockchain.anchor, {
        certificateId,
        transactionHash,
      });
      
      return response;
    } catch (error) {
      console.error('Blockchain sync error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const blockchainService = new BlockchainService();

export { blockchainService };
export default blockchainService;