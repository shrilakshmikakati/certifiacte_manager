// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing certificate records on Ganache
 * 
 * This contract provides a decentralized registry for educational certificates
 * with multi-role access control and IPFS integration for document storage.
 */
contract CertificateRegistry is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE"); 
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Certificate status enumeration
    enum CertificateStatus {
        Pending,    // 0: Created, awaiting verification
        Approved,   // 1: Verified and approved
        Rejected,   // 2: Rejected by verifier
        Issued,     // 3: Finalized and issued
        Revoked     // 4: Revoked after issuance
    }
    
    // Certificate structure
    struct Certificate {
        bytes32 certificateHash;    // Keccak256 hash of certificate data
        string ipfsCID;             // IPFS Content Identifier
        CertificateStatus status;   // Current certificate status
        address creator;            // Address of certificate creator
        address verifier;           // Address of verifier (if approved)
        address issuer;             // Address of issuer (if issued)
        uint256 createdAt;          // Creation timestamp
        uint256 verifiedAt;         // Verification timestamp
        uint256 issuedAt;           // Issuance timestamp
        string metadata;            // Additional metadata (JSON string)
    }
    
    // State variables
    Counters.Counter private _certificateIds;
    mapping(uint256 => Certificate) public certificates;
    mapping(bytes32 => uint256) public hashToCertificateId;
    mapping(address => uint256[]) public creatorCertificates;
    mapping(string => bool) public usedIPFSCIDs;
    
    // Events
    event CertificateCreated(
        uint256 indexed certificateId,
        bytes32 indexed certificateHash,
        string ipfsCID,
        address indexed creator
    );
    
    event CertificateVerified(
        uint256 indexed certificateId,
        address indexed verifier,
        CertificateStatus status
    );
    
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed issuer
    );
    
    event CertificateRevoked(
        uint256 indexed certificateId,
        address indexed revoker,
        string reason
    );
    
    // RoleGranted event is inherited from AccessControl
    
    // Custom errors
    error CertificateNotFound(uint256 certificateId);
    error CertificateAlreadyExists(bytes32 certificateHash);
    error InvalidStatus(CertificateStatus current, CertificateStatus required);
    error IPFSCIDAlreadyUsed(string cid);
    error UnauthorizedAccess(address caller, bytes32 role);
    error InvalidCertificateHash();
    error EmptyIPFSCID();
    
    /**
     * @dev Constructor sets up initial roles and admin
     * @param _admin Initial admin address
     */
    constructor(address _admin) {
        require(_admin != address(0), "Admin address cannot be zero");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        
        // Set role hierarchies
        _setRoleAdmin(CREATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(VERIFIER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
    }
    
    /**
     * @dev Creates a new certificate record
     * @param _certificateHash Keccak256 hash of certificate data
     * @param _ipfsCID IPFS Content Identifier for stored certificate
     * @param _metadata Additional metadata as JSON string
     * @return certificateId The ID of the created certificate
     */
    function createCertificate(
        bytes32 _certificateHash,
        string calldata _ipfsCID,
        string calldata _metadata
    ) external onlyRole(CREATOR_ROLE) whenNotPaused nonReentrant returns (uint256) {
        if (_certificateHash == bytes32(0)) revert InvalidCertificateHash();
        if (bytes(_ipfsCID).length == 0) revert EmptyIPFSCID();
        if (hashToCertificateId[_certificateHash] != 0) {
            revert CertificateAlreadyExists(_certificateHash);
        }
        if (usedIPFSCIDs[_ipfsCID]) {
            revert IPFSCIDAlreadyUsed(_ipfsCID);
        }
        
        _certificateIds.increment();
        uint256 certificateId = _certificateIds.current();
        
        certificates[certificateId] = Certificate({
            certificateHash: _certificateHash,
            ipfsCID: _ipfsCID,
            status: CertificateStatus.Pending,
            creator: msg.sender,
            verifier: address(0),
            issuer: address(0),
            createdAt: block.timestamp,
            verifiedAt: 0,
            issuedAt: 0,
            metadata: _metadata
        });
        
        hashToCertificateId[_certificateHash] = certificateId;
        creatorCertificates[msg.sender].push(certificateId);
        usedIPFSCIDs[_ipfsCID] = true;
        
        emit CertificateCreated(certificateId, _certificateHash, _ipfsCID, msg.sender);
        
        return certificateId;
    }
    
    /**
     * @dev Verifies or rejects a certificate
     * @param _certificateId ID of the certificate to verify
     * @param _approved True to approve, false to reject
     */
    function verifyCertificate(
        uint256 _certificateId,
        bool _approved
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        Certificate storage cert = certificates[_certificateId];
        
        if (cert.creator == address(0)) revert CertificateNotFound(_certificateId);
        if (cert.status != CertificateStatus.Pending) {
            revert InvalidStatus(cert.status, CertificateStatus.Pending);
        }
        
        cert.status = _approved ? CertificateStatus.Approved : CertificateStatus.Rejected;
        cert.verifier = msg.sender;
        cert.verifiedAt = block.timestamp;
        
        emit CertificateVerified(_certificateId, msg.sender, cert.status);
    }
    
    /**
     * @dev Issues an approved certificate
     * @param _certificateId ID of the certificate to issue
     */
    function issueCertificate(
        uint256 _certificateId
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        Certificate storage cert = certificates[_certificateId];
        
        if (cert.creator == address(0)) revert CertificateNotFound(_certificateId);
        if (cert.status != CertificateStatus.Approved) {
            revert InvalidStatus(cert.status, CertificateStatus.Approved);
        }
        
        cert.status = CertificateStatus.Issued;
        cert.issuer = msg.sender;
        cert.issuedAt = block.timestamp;
        
        emit CertificateIssued(_certificateId, msg.sender);
    }
    
    /**
     * @dev Revokes an issued certificate
     * @param _certificateId ID of the certificate to revoke
     * @param _reason Reason for revocation
     */
    function revokeCertificate(
        uint256 _certificateId,
        string calldata _reason
    ) external whenNotPaused {
        Certificate storage cert = certificates[_certificateId];
        
        if (cert.creator == address(0)) revert CertificateNotFound(_certificateId);
        if (cert.status != CertificateStatus.Issued) {
            revert InvalidStatus(cert.status, CertificateStatus.Issued);
        }
        
        // Only issuer or admin can revoke
        if (!hasRole(ISSUER_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess(msg.sender, ISSUER_ROLE);
        }
        
        cert.status = CertificateStatus.Revoked;
        
        emit CertificateRevoked(_certificateId, msg.sender, _reason);
    }
    
    /**
     * @dev Gets certificate details by ID
     * @param _certificateId ID of the certificate
     * @return Certificate struct data
     */
    function getCertificate(uint256 _certificateId) 
        external 
        view 
        returns (Certificate memory) 
    {
        Certificate memory cert = certificates[_certificateId];
        if (cert.creator == address(0)) revert CertificateNotFound(_certificateId);
        return cert;
    }
    
    /**
     * @dev Gets certificate ID by hash
     * @param _certificateHash Hash of the certificate
     * @return Certificate ID (0 if not found)
     */
    function getCertificateIdByHash(bytes32 _certificateHash) 
        external 
        view 
        returns (uint256) 
    {
        return hashToCertificateId[_certificateHash];
    }
    
    /**
     * @dev Verifies if a certificate hash exists and is issued
     * @param _certificateHash Hash to verify
     * @return True if certificate exists and is issued
     */
    function verifyCertificateHash(bytes32 _certificateHash) 
        external 
        view 
        returns (bool) 
    {
        uint256 certId = hashToCertificateId[_certificateHash];
        if (certId == 0) return false;
        
        return certificates[certId].status == CertificateStatus.Issued;
    }
    
    /**
     * @dev Gets certificates created by an address
     * @param _creator Creator address
     * @return Array of certificate IDs
     */
    function getCertificatesByCreator(address _creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorCertificates[_creator];
    }
    
    /**
     * @dev Gets total number of certificates
     * @return Total certificate count
     */
    function getTotalCertificates() external view returns (uint256) {
        return _certificateIds.current();
    }
    
    /**
     * @dev Gets certificates by status with pagination
     * @param _status Status to filter by
     * @param _offset Starting index
     * @param _limit Number of results to return
     * @return certificateIds Array of certificate IDs
     * @return hasMore True if more results available
     */
    function getCertificatesByStatus(
        CertificateStatus _status,
        uint256 _offset,
        uint256 _limit
    ) external view returns (uint256[] memory certificateIds, bool hasMore) {
        uint256 total = _certificateIds.current();
        uint256 count = 0;
        uint256 found = 0;
        
        // Count matching certificates
        for (uint256 i = 1; i <= total; i++) {
            if (certificates[i].status == _status) {
                if (count >= _offset && found < _limit) {
                    found++;
                }
                count++;
            }
        }
        
        certificateIds = new uint256[](found);
        uint256 index = 0;
        count = 0;
        
        // Collect matching certificate IDs
        for (uint256 i = 1; i <= total && index < found; i++) {
            if (certificates[i].status == _status) {
                if (count >= _offset) {
                    certificateIds[index] = i;
                    index++;
                }
                count++;
            }
        }
        
        hasMore = count > _offset + _limit;
        return (certificateIds, hasMore);
    }
    
    /**
     * @dev Batch create certificates (for efficiency)
     * @param _hashes Array of certificate hashes
     * @param _cids Array of IPFS CIDs
     * @param _metadatas Array of metadata strings
     * @return Array of created certificate IDs
     */
    function batchCreateCertificates(
        bytes32[] calldata _hashes,
        string[] calldata _cids,
        string[] calldata _metadatas
    ) external onlyRole(CREATOR_ROLE) whenNotPaused nonReentrant returns (uint256[] memory) {
        require(_hashes.length == _cids.length && _cids.length == _metadatas.length, 
                "Arrays length mismatch");
        require(_hashes.length > 0 && _hashes.length <= 100, "Invalid batch size");
        
        uint256[] memory certificateIds = new uint256[](_hashes.length);
        
        for (uint256 i = 0; i < _hashes.length; i++) {
            certificateIds[i] = this.createCertificate(
                _hashes[i], 
                _cids[i], 
                _metadatas[i]
            );
        }
        
        return certificateIds;
    }
    
    // Admin functions
    
    /**
     * @dev Grants a role to an account
     * @param _role Role to grant
     * @param _account Account to grant role to
     */
    function grantRole(bytes32 _role, address _account) 
        public 
        override 
        onlyRole(getRoleAdmin(_role)) 
    {
        super.grantRole(_role, _account);
        emit RoleGranted(_role, _account, msg.sender);
    }
    
    /**
     * @dev Pauses the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency function to update certificate metadata
     * @param _certificateId Certificate ID
     * @param _newMetadata New metadata
     */
    function updateCertificateMetadata(
        uint256 _certificateId,
        string calldata _newMetadata
    ) external onlyRole(ADMIN_ROLE) {
        Certificate storage cert = certificates[_certificateId];
        if (cert.creator == address(0)) revert CertificateNotFound(_certificateId);
        
        cert.metadata = _newMetadata;
    }
}