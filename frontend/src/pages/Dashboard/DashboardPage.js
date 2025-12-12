import React from 'react';
import { 
  AcademicCapIcon, 
  CheckBadgeIcon, 
  ClockIcon, 
  UsersIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, StatsCard, FeatureCard } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge, StatusBadge } from '../../components/UI/Badge';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useWeb3();

  // Mock data - replace with actual API calls
  const stats = {
    totalCertificates: 1247,
    pendingVerification: 23,
    issuedCertificates: 892,
    activeUsers: 156,
    monthlyGrowth: 12.5,
    verificationRate: 94.2
  };

  const recentCertificates = [
    {
      id: 'CERT-2024-001',
      title: 'React Development Certificate',
      recipient: 'John Doe',
      status: 'issued',
      createdAt: '2024-12-10T10:00:00Z',
      course: 'Advanced React Development'
    },
    {
      id: 'CERT-2024-002',
      title: 'Blockchain Development Certificate',
      recipient: 'Jane Smith',
      status: 'pending_verification',
      createdAt: '2024-12-10T09:30:00Z',
      course: 'Blockchain Fundamentals'
    },
    {
      id: 'CERT-2024-003',
      title: 'UI/UX Design Certificate',
      recipient: 'Mike Johnson',
      status: 'verified',
      createdAt: '2024-12-10T08:45:00Z',
      course: 'Modern UI/UX Design'
    }
  ];

  const quickActions = [
    {
      title: 'Create Certificate',
      description: 'Create a new certificate for a student',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      action: () => navigate('/app/certificates/new'),
      variant: 'primary',
      roles: ['creator', 'admin']
    },
    {
      title: 'Bulk Upload',
      description: 'Upload multiple certificates via CSV',
      icon: <AcademicCapIcon className="h-6 w-6" />,
      action: () => navigate('/app/upload'),
      variant: 'secondary',
      roles: ['creator', 'admin']
    },
    {
      title: 'Verify Certificate',
      description: 'Review and verify pending certificates',
      icon: <CheckBadgeIcon className="h-6 w-6" />,
      action: () => navigate('/app/verification'),
      variant: 'success',
      roles: ['verifier', 'admin']
    },
    {
      title: 'View All Certificates',
      description: 'Browse all certificates in the system',
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      action: () => navigate('/app/certificates'),
      variant: 'outline'
    }
  ];

  // Filter actions based on user role
  const filteredActions = quickActions.filter(action => {
    if (!action.roles) return true;
    return action.roles.includes(user?.role);
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your certificates today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge variant={isConnected ? 'success' : 'outline-danger'}>
            {isConnected ? '🔗 Wallet Connected' : '⚠️ Wallet Disconnected'}
          </Badge>
          <Button onClick={() => navigate('/app/certificates/new')}>
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Create Certificate
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Certificates"
          value={stats.totalCertificates.toLocaleString()}
          subtitle="All time"
          icon={<AcademicCapIcon className="h-6 w-6" />}
          trend="up"
          trendValue="+12% from last month"
          color="primary"
        />
        
        <StatsCard
          title="Pending Verification"
          value={stats.pendingVerification}
          subtitle="Awaiting review"
          icon={<ClockIcon className="h-6 w-6" />}
          trend="neutral"
          trendValue="3 new today"
          color="warning"
        />
        
        <StatsCard
          title="Issued Certificates"
          value={stats.issuedCertificates.toLocaleString()}
          subtitle="Successfully issued"
          icon={<CheckBadgeIcon className="h-6 w-6" />}
          trend="up"
          trendValue="+8% from last month"
          color="success"
        />
        
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          subtitle="This month"
          icon={<UsersIcon className="h-6 w-6" />}
          trend="up"
          trendValue="+5 new users"
          color="gray"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Certificates */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Certificates
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/app/certificates')}
                >
                  View All
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/certificates/${cert.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <AcademicCapIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {cert.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {cert.recipient} • {cert.course}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={cert.status} />
                      <span className="text-xs text-gray-500">
                        {new Date(cert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Analytics */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {filteredActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant}
                    size="sm"
                    className="w-full justify-start"
                    leftIcon={action.icon}
                    onClick={action.action}
                  >
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs opacity-75">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Monthly Growth</span>
                <div className="flex items-center space-x-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" />
                  <span className="text-sm font-semibold text-success-600">
                    +{stats.monthlyGrowth}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Verification Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.verificationRate}%
                </span>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Overall Progress</span>
                  <span className="text-xs font-medium text-gray-600">{stats.verificationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${stats.verificationRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* System Status */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Blockchain Network</span>
                <Badge variant={isConnected ? 'success' : 'danger'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">IPFS Gateway</span>
                <Badge variant="success">Online</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          title="Secure & Immutable"
          description="Certificates are secured on the blockchain and cannot be tampered with or forged."
          icon={<ShieldCheckIcon className="h-6 w-6" />}
        />
        <FeatureCard
          title="Instant Verification"
          description="Verify any certificate instantly using our blockchain-based verification system."
          icon={<CheckBadgeIcon className="h-6 w-6" />}
        />
        <FeatureCard
          title="Global Accessibility"
          description="Access and verify certificates from anywhere in the world through IPFS storage."
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
      </div>
    </div>
  );
};

export default DashboardPage;