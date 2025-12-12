import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { Card, DetailCard } from '../../components/UI/Card';
import { Button, IconButton } from '../../components/UI/Button';
import { Badge, StatusBadge } from '../../components/UI/Badge';
import { LoadingSpinner, CardLoading } from '../../components/UI/LoadingSpinner';
import { ConfirmationModal, InfoModal } from '../../components/UI/Modal';
import { Alert } from '../../components/UI/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { cn, formatDate, formatDateTime } from '../../utils/cn';

const CertificateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { isConnected, account } = useWeb3();
  
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [blockchainDetails, setBlockchainDetails] = useState(null);

  // Mock certificate data - replace with actual API call
  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCertificate({
        id: 'CERT-2024-001',
        title: 'Advanced React Development Certificate',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        courseName: 'Advanced React Development',
        courseDescription: 'Comprehensive course covering advanced React patterns, hooks, state management, and performance optimization.',
        issuerName: 'Tech Academy',
        issuerEmail: 'academy@tech.com',
        status: 'issued',
        grade: 'A+',
        score: 95,
        completionDate: '2024-12-08',
        issueDate: '2024-12-10T14:30:00Z',
        expiryDate: null,
        createdAt: '2024-12-10T10:00:00Z',
        updatedAt: '2024-12-10T14:30:00Z',
        createdBy: {
          name: 'Alice Johnson',
          email: 'alice@tech.com',
          role: 'creator'
        },
        verifiedBy: {
          name: 'Bob Smith',
          email: 'bob@tech.com',
          role: 'verifier',
          verifiedAt: '2024-12-10T12:15:00Z'
        },
        issuedBy: {
          name: 'Carol Wilson',
          email: 'carol@tech.com',
          role: 'issuer',
          issuedAt: '2024-12-10T14:30:00Z'
        },
        ipfsHash: 'QmX5ZKX...',
        blockchainTxHash: '0x123abc...',
        encryptionKeyId: 'key_2024_001',
        metadata: {
          duration: '40 hours',
          instructor: 'Dr. Sarah Tech',
          credits: 3,
          skills: ['React', 'TypeScript', 'State Management', 'Performance Optimization']
        },
        files: [
          {
            id: 'file_1',
            name: 'certificate.pdf',
            type: 'application/pdf',
            size: 1024000,
            uploadedAt: '2024-12-10T10:15:00Z'
          },
          {
            id: 'file_2',
            name: 'transcript.pdf',
            type: 'application/pdf',
            size: 512000,
            uploadedAt: '2024-12-10T10:16:00Z'
          }
        ],
        auditLog: [
          {
            action: 'created',
            user: 'Alice Johnson',
            timestamp: '2024-12-10T10:00:00Z',
            details: 'Certificate created from bulk upload'
          },
          {
            action: 'verified',
            user: 'Bob Smith',
            timestamp: '2024-12-10T12:15:00Z',
            details: 'Certificate verified and approved'
          },
          {
            action: 'issued',
            user: 'Carol Wilson',
            timestamp: '2024-12-10T14:30:00Z',
            details: 'Certificate issued and stored on blockchain'
          }
        ]
      });
      
      setVerificationDetails({
        isValid: true,
        verificationUrl: `${window.location.origin}/verify/${id}`,
        qrCode: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI...`, // Mock QR code
        verificationCount: 15,
        lastVerified: '2024-12-10T16:45:00Z'
      });
      
      setBlockchainDetails({
        network: 'zkSync Era Mainnet',
        contractAddress: '0x742d35Cc61C4532A52558B85c9F8f524...',
        transactionHash: '0x123abc456def789...',
        blockNumber: 2845671,
        gasUsed: 45000,
        timestamp: '2024-12-10T14:32:15Z',
        confirmations: 1247
      });
      
      setLoading(false);
    };

    if (id) {
      fetchCertificate();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/app/certificates/${id}/edit`);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setActionLoading(false);
    setDeleteModalOpen(false);
    navigate('/app/certificates');
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download certificate:', id);
  };

  const handleCopyVerificationUrl = () => {
    navigator.clipboard.writeText(verificationDetails.verificationUrl);
    // Show toast notification
  };

  const handleViewOnBlockchain = () => {
    const explorerUrl = `https://explorer.zksync.io/tx/${blockchainDetails.transactionHash}`;
    window.open(explorerUrl, '_blank');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'issued':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'verified':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'pending_verification':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'draft':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      case 'revoked':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'issued':
        return 'This certificate has been successfully issued and is stored on the blockchain.';
      case 'verified':
        return 'This certificate has been verified but not yet issued to the recipient.';
      case 'pending_verification':
        return 'This certificate is waiting for verification by an authorized verifier.';
      case 'draft':
        return 'This certificate is in draft mode and has not been submitted for verification.';
      case 'revoked':
        return 'This certificate has been revoked and is no longer valid.';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <CardLoading />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardLoading />
          </div>
          <CardLoading />
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Certificate not found</h3>
        <p className="mt-1 text-sm text-gray-500">The certificate you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Button onClick={() => navigate('/app/certificates')}>
            Back to Certificates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/app/certificates')}
            className="p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{certificate.title}</h1>
            <p className="text-sm text-gray-500">Certificate ID: {certificate.id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <IconButton
            icon={<ShareIcon className="h-4 w-4" />}
            onClick={handleShare}
            tooltip="Share"
          />
          <IconButton
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
            onClick={handleDownload}
            tooltip="Download"
          />
          {hasPermission('update') && (
            <IconButton
              icon={<PencilIcon className="h-4 w-4" />}
              onClick={handleEdit}
              tooltip="Edit"
            />
          )}
          {hasPermission('delete') && (
            <IconButton
              icon={<TrashIcon className="h-4 w-4" />}
              onClick={() => setDeleteModalOpen(true)}
              tooltip="Delete"
              className="text-red-600 hover:text-red-700"
            />
          )}
        </div>
      </div>

      {/* Status Alert */}
      <Alert 
        type={certificate.status === 'issued' ? 'success' : certificate.status === 'revoked' ? 'error' : 'info'}
        title={`Certificate Status: ${certificate.status.replace('_', ' ').toUpperCase()}`}
        className="border-l-4"
      >
        <div className="flex items-center">
          {getStatusIcon(certificate.status)}
          <span className="ml-2">{getStatusDescription(certificate.status)}</span>
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Certificate Details */}
          <DetailCard title="Certificate Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name
                </label>
                <p className="text-sm text-gray-900">{certificate.recipientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <p className="text-sm text-gray-900">{certificate.recipientEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name
                </label>
                <p className="text-sm text-gray-900">{certificate.courseName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer
                </label>
                <p className="text-sm text-gray-900">{certificate.issuerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">{certificate.grade}</Badge>
                  <span className="text-sm text-gray-600">({certificate.score}%)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(certificate.completionDate)}</p>
              </div>
              {certificate.expiryDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(certificate.expiryDate)}</p>
                </div>
              )}
            </div>
            
            {certificate.courseDescription && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Description
                </label>
                <p className="text-sm text-gray-900">{certificate.courseDescription}</p>
              </div>
            )}

            {certificate.metadata.skills && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills & Competencies
                </label>
                <div className="flex flex-wrap gap-2">
                  {certificate.metadata.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </DetailCard>

          {/* Course Metadata */}
          {certificate.metadata && (
            <DetailCard title="Course Details">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {certificate.metadata.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <p className="text-sm text-gray-900">{certificate.metadata.duration}</p>
                  </div>
                )}
                {certificate.metadata.instructor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor
                    </label>
                    <p className="text-sm text-gray-900">{certificate.metadata.instructor}</p>
                  </div>
                )}
                {certificate.metadata.credits && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credits
                    </label>
                    <p className="text-sm text-gray-900">{certificate.metadata.credits}</p>
                  </div>
                )}
              </div>
            </DetailCard>
          )}

          {/* Workflow History */}
          <DetailCard title="Workflow History">
            <div className="flow-root">
              <ul className="-mb-8">
                {certificate.auditLog.map((log, index) => (
                  <li key={index}>
                    <div className="relative pb-8">
                      {index !== certificate.auditLog.length - 1 && (
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                            log.action === 'created' && "bg-gray-400",
                            log.action === 'verified' && "bg-blue-500",
                            log.action === 'issued' && "bg-green-500",
                            log.action === 'revoked' && "bg-red-500"
                          )}>
                            {log.action === 'created' && <PencilIcon className="h-4 w-4 text-white" />}
                            {log.action === 'verified' && <CheckCircleIcon className="h-4 w-4 text-white" />}
                            {log.action === 'issued' && <GlobeAltIcon className="h-4 w-4 text-white" />}
                            {log.action === 'revoked' && <XCircleIcon className="h-4 w-4 text-white" />}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{log.user}</span>{' '}
                              {log.action} the certificate
                            </p>
                            {log.details && (
                              <p className="text-sm text-gray-400 mt-1">{log.details}</p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            {formatDateTime(log.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </DetailCard>

          {/* Files */}
          {certificate.files && certificate.files.length > 0 && (
            <DetailCard title="Attached Files">
              <div className="space-y-3">
                {certificate.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentDuplicateIcon className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded {formatDateTime(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </DetailCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => window.open(verificationDetails.verificationUrl, '_blank')}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Public Certificate
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleCopyVerificationUrl}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Copy Verification Link
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleDownload}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {blockchainDetails && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleViewOnBlockchain}
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                    View on Blockchain
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Verification Status */}
          {verificationDetails && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verification</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {verificationDetails.isValid ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      verificationDetails.isValid ? "text-green-700" : "text-red-700"
                    )}>
                      {verificationDetails.isValid ? 'Valid Certificate' : 'Invalid Certificate'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Count
                    </label>
                    <p className="text-sm text-gray-900">{verificationDetails.verificationCount} times</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Verified
                    </label>
                    <p className="text-sm text-gray-900">{formatDateTime(verificationDetails.lastVerified)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code
                    </label>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="w-24 h-24 mx-auto bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">QR Code</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Blockchain Status */}
          {blockchainDetails && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Blockchain Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Network
                    </label>
                    <p className="text-sm text-gray-900">{blockchainDetails.network}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction Hash
                    </label>
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {blockchainDetails.transactionHash}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block Number
                    </label>
                    <p className="text-sm text-gray-900">{blockchainDetails.blockNumber.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmations
                    </label>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-900">{blockchainDetails.confirmations.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Security Status */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <LockClosedIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">AES-256 Encrypted</span>
                </div>
                
                {certificate.ipfsHash && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IPFS Hash
                    </label>
                    <p className="text-sm text-gray-900 font-mono break-all">{certificate.ipfsHash}</p>
                  </div>
                )}
                
                {certificate.encryptionKeyId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Encryption Key ID
                    </label>
                    <p className="text-sm text-gray-900">{certificate.encryptionKeyId}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Certificate"
        message={`Are you sure you want to delete "${certificate.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
      />

      {/* Share Modal */}
      <InfoModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Certificate"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Verification URL
            </label>
            <div className="flex">
              <input
                type="text"
                value={verificationDetails?.verificationUrl || ''}
                readOnly
                className="flex-1 form-input rounded-r-none"
              />
              <Button 
                onClick={handleCopyVerificationUrl}
                className="rounded-l-none"
              >
                Copy
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex items-center justify-center mb-2">
              <span className="text-sm text-gray-500">QR Code</span>
            </div>
            <p className="text-sm text-gray-600">Scan to verify certificate</p>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1">
              <ShareIcon className="h-4 w-4 mr-2" />
              Share Link
            </Button>
            <Button variant="outline" className="flex-1">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download QR
            </Button>
          </div>
        </div>
      </InfoModal>
    </div>
  );
};

export default CertificateDetailPage;