import React, { useState, useMemo } from 'react';
import { 
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Card, CertificateCard } from '../../components/UI/Card';
import { Button, IconButton } from '../../components/UI/Button';
import { Input, SearchInput } from '../../components/UI/Input';
import { Badge, StatusBadge } from '../../components/UI/Badge';
import { LoadingSpinner, CardLoading } from '../../components/UI/LoadingSpinner';
import { ConfirmationModal } from '../../components/UI/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn, formatDate } from '../../utils/cn';

const CertificatesPage = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState(null);

  // Mock certificates data - replace with actual API call
  const certificates = [
    {
      id: 'CERT-2024-001',
      title: 'Advanced React Development Certificate',
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      courseName: 'Advanced React Development',
      issuerName: 'Tech Academy',
      status: 'issued',
      createdAt: '2024-12-10T10:00:00Z',
      updatedAt: '2024-12-10T14:30:00Z',
      grade: 'A+',
      completionDate: '2024-12-08',
      ipfsHash: 'QmX...',
      blockchainTxHash: '0x123...'
    },
    {
      id: 'CERT-2024-002',
      title: 'Blockchain Fundamentals Certificate',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      courseName: 'Blockchain Fundamentals',
      issuerName: 'Crypto Institute',
      status: 'pending_verification',
      createdAt: '2024-12-09T15:20:00Z',
      updatedAt: '2024-12-09T15:20:00Z',
      grade: 'A',
      completionDate: '2024-12-07',
      ipfsHash: null,
      blockchainTxHash: null
    },
    {
      id: 'CERT-2024-003',
      title: 'UI/UX Design Certificate',
      recipientName: 'Mike Johnson',
      recipientEmail: 'mike@example.com',
      courseName: 'Modern UI/UX Design',
      issuerName: 'Design School',
      status: 'verified',
      createdAt: '2024-12-08T09:15:00Z',
      updatedAt: '2024-12-10T11:45:00Z',
      grade: 'B+',
      completionDate: '2024-12-06',
      ipfsHash: 'QmY...',
      blockchainTxHash: null
    },
    {
      id: 'CERT-2024-004',
      title: 'Python Programming Certificate',
      recipientName: 'Sarah Wilson',
      recipientEmail: 'sarah@example.com',
      courseName: 'Python Programming Masterclass',
      issuerName: 'Code Academy',
      status: 'draft',
      createdAt: '2024-12-07T14:00:00Z',
      updatedAt: '2024-12-07T16:20:00Z',
      grade: 'A-',
      completionDate: '2024-12-05',
      ipfsHash: null,
      blockchainTxHash: null
    },
    {
      id: 'CERT-2024-005',
      title: 'Data Science Certificate',
      recipientName: 'David Brown',
      recipientEmail: 'david@example.com',
      courseName: 'Data Science & Machine Learning',
      issuerName: 'AI Institute',
      status: 'revoked',
      createdAt: '2024-12-06T10:30:00Z',
      updatedAt: '2024-12-09T13:15:00Z',
      grade: 'B',
      completionDate: '2024-12-04',
      ipfsHash: 'QmZ...',
      blockchainTxHash: '0x456...'
    }
  ];

  // Filter and sort certificates
  const filteredCertificates = useMemo(() => {
    let filtered = certificates.filter(cert => {
      const matchesSearch = 
        cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort certificates
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'recipientName':
          aValue = a.recipientName.toLowerCase();
          bValue = b.recipientName.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [certificates, searchQuery, statusFilter, sortBy, sortOrder]);

  const statusOptions = [
    { value: 'all', label: 'All Status', count: certificates.length },
    { value: 'draft', label: 'Draft', count: certificates.filter(c => c.status === 'draft').length },
    { value: 'pending_verification', label: 'Pending Verification', count: certificates.filter(c => c.status === 'pending_verification').length },
    { value: 'verified', label: 'Verified', count: certificates.filter(c => c.status === 'verified').length },
    { value: 'issued', label: 'Issued', count: certificates.filter(c => c.status === 'issued').length },
    { value: 'revoked', label: 'Revoked', count: certificates.filter(c => c.status === 'revoked').length },
  ];

  const handleView = (certificate) => {
    navigate(`/app/certificates/${certificate.id}`);
  };

  const handleEdit = (certificate) => {
    navigate(`/app/certificates/${certificate.id}/edit`);
  };

  const handleDelete = (certificate) => {
    setCertificateToDelete(certificate);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setDeleteModalOpen(false);
    setCertificateToDelete(null);
    // In real app, you would remove from state or refetch data
  };

  const handleShare = (certificate) => {
    const url = `${window.location.origin}/verify/${certificate.id}`;
    navigator.clipboard.writeText(url);
    // Show toast notification
  };

  const handleDownload = (certificate) => {
    // Implement download functionality
    console.log('Download certificate:', certificate.id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardLoading key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all certificates in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {hasPermission('create') && (
            <Button onClick={() => navigate('/app/certificates/new')}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchInput
                placeholder="Search certificates, recipients, or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="form-select text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="recipientName-asc">Recipient A-Z</option>
                <option value="recipientName-desc">Recipient Z-A</option>
                <option value="status-asc">Status</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <Badge variant="outline" className="gap-1">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="gap-1">
                  Status: {statusOptions.find(s => s.value === statusFilter)?.label}
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredCertificates.length}</span> of{' '}
          <span className="font-medium">{certificates.length}</span> certificates
        </p>
      </div>

      {/* Certificates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onClick={() => handleView(certificate)}
              onView={() => handleView(certificate)}
              onEdit={hasPermission('update') ? () => handleEdit(certificate) : null}
              onDelete={hasPermission('delete') ? () => handleDelete(certificate) : null}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((certificate) => (
                  <tr 
                    key={certificate.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleView(certificate)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {certificate.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {certificate.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {certificate.recipientName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {certificate.courseName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={certificate.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(certificate.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          icon={<EyeIcon className="h-4 w-4" />}
                          onClick={() => handleView(certificate)}
                          tooltip="View"
                          size="icon-sm"
                        />
                        <IconButton
                          icon={<ShareIcon className="h-4 w-4" />}
                          onClick={() => handleShare(certificate)}
                          tooltip="Share"
                          size="icon-sm"
                        />
                        <IconButton
                          icon={<ArrowDownTrayIcon className="h-4 w-4" />}
                          onClick={() => handleDownload(certificate)}
                          tooltip="Download"
                          size="icon-sm"
                        />
                        {hasPermission('update') && (
                          <IconButton
                            icon={<PencilIcon className="h-4 w-4" />}
                            onClick={() => handleEdit(certificate)}
                            tooltip="Edit"
                            size="icon-sm"
                          />
                        )}
                        {hasPermission('delete') && (
                          <IconButton
                            icon={<TrashIcon className="h-4 w-4" />}
                            onClick={() => handleDelete(certificate)}
                            tooltip="Delete"
                            variant="ghost"
                            className="text-danger-600 hover:text-danger-700"
                            size="icon-sm"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredCertificates.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first certificate.'
              }
            </p>
            <div className="mt-6">
              {hasPermission('create') && (
                <Button onClick={() => navigate('/app/certificates/new')}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Certificate
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Certificate"
        message={`Are you sure you want to delete the certificate "${certificateToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={loading}
      />
    </div>
  );
};

export default CertificatesPage;