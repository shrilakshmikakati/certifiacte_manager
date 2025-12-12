import React, { useState } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Alert } from '../../components/UI/Alert';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom';

const VerificationPage = () => {
  const { certificateId } = useParams();
  const [searchId, setSearchId] = useState(certificateId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock verification result
      const isValid = Math.random() > 0.3; // 70% chance of valid
      
      if (isValid) {
        setVerificationResult({
          isValid: true,
          certificate: {
            id: searchId,
            title: 'Advanced React Development Certificate',
            recipientName: 'John Doe',
            recipientEmail: 'john@example.com',
            courseName: 'Advanced React Development',
            issuerName: 'Tech Academy',
            issueDate: '2024-12-10T14:30:00Z',
            completionDate: '2024-12-08',
            grade: 'A+',
            blockchainTxHash: '0x123abc456def...',
            ipfsHash: 'QmX5ZKX...',
            verificationCount: 15
          }
        });
      } else {
        setVerificationResult({
          isValid: false,
          error: 'Certificate not found or has been revoked'
        });
      }
    } catch (err) {
      setError('Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
              <p className="text-sm text-gray-600">Verify the authenticity of digital certificates</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <Card className="mb-8">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Enter Certificate ID</h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter certificate ID (e.g., CERT-2024-001)"
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  disabled={!searchId.trim() || loading}
                  className="px-8"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Certificate IDs are usually in the format CERT-YYYY-XXX. You can find this ID on your certificate document.
              </p>
            </form>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Verification Error" className="mb-8">
            {error}
          </Alert>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <Card className="mb-8">
            <div className="p-8">
              {verificationResult.isValid ? (
                <>
                  {/* Valid Certificate */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-green-900">Certificate Verified</h3>
                      <p className="text-green-700">This certificate is authentic and valid</p>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Certificate Title</p>
                          <p className="text-gray-900">{verificationResult.certificate.title}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Recipient</p>
                          <p className="text-gray-900">{verificationResult.certificate.recipientName}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Course</p>
                          <p className="text-gray-900">{verificationResult.certificate.courseName}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Completion Date</p>
                          <p className="text-gray-900">{formatDate(verificationResult.certificate.completionDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Issuer</p>
                          <p className="text-gray-900">{verificationResult.certificate.issuerName}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">Grade</p>
                          <p className="text-gray-900">{verificationResult.certificate.grade}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">Issue Date</p>
                          <p className="text-gray-900">{formatDate(verificationResult.certificate.issueDate)}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">Verification Count</p>
                          <p className="text-gray-900">{verificationResult.certificate.verificationCount} times</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Verification */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Blockchain Verification</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Transaction Hash:</strong> {verificationResult.certificate.blockchainTxHash}</p>
                      <p><strong>IPFS Hash:</strong> {verificationResult.certificate.ipfsHash}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Invalid Certificate */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-red-900">Certificate Invalid</h3>
                      <p className="text-red-700">{verificationResult.error}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-red-800 font-medium">This certificate could not be verified because:</p>
                        <ul className="text-red-700 mt-2 space-y-1 list-disc list-inside">
                          <li>The certificate ID was not found in our system</li>
                          <li>The certificate may have been revoked</li>
                          <li>There may be a typo in the certificate ID</li>
                        </ul>
                        <p className="text-red-700 mt-3">
                          Please double-check the certificate ID or contact the issuing organization.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Information */}
        <Card>
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How Certificate Verification Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-semibold">1</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">Enter Certificate ID</p>
                <p>Input the unique certificate identifier found on your certificate document.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-semibold">2</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">Blockchain Lookup</p>
                <p>Our system checks the certificate against blockchain records for authenticity.</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-semibold">3</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">Instant Results</p>
                <p>Get immediate verification results with detailed certificate information.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerificationPage;