import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckBadgeIcon,
  CogIcon,
  UserIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../UI/Badge';
import { cn } from '../../utils/cn';

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/app/dashboard', 
      icon: HomeIcon, 
      description: 'Overview & Analytics' 
    },
    { 
      name: 'Certificates', 
      href: '/app/certificates', 
      icon: AcademicCapIcon, 
      description: 'Manage Certificates',
      badge: { count: 5, variant: 'primary' } // Example badge
    },
    { 
      name: 'Create Certificate', 
      href: '/app/certificates/new', 
      icon: DocumentTextIcon, 
      description: 'Create New Certificate',
      roles: ['creator', 'admin']
    },
    { 
      name: 'Bulk Upload', 
      href: '/app/upload', 
      icon: CloudArrowUpIcon, 
      description: 'CSV Upload & Batch Processing',
      roles: ['creator', 'admin']
    },
    { 
      name: 'Verification', 
      href: '/app/verification', 
      icon: CheckBadgeIcon, 
      description: 'Verify Certificates',
      badge: { count: 2, variant: 'warning' }
    },
    { 
      name: 'Analytics', 
      href: '/app/analytics', 
      icon: ChartBarIcon, 
      description: 'Reports & Insights',
      roles: ['admin', 'issuer']
    },
  ];

  const bottomNavigation = [
    { 
      name: 'Profile', 
      href: '/app/profile', 
      icon: UserIcon, 
      description: 'User Profile' 
    },
    { 
      name: 'Settings', 
      href: '/app/settings', 
      icon: CogIcon, 
      description: 'Application Settings' 
    },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const isCurrentPage = (href) => {
    return location.pathname === href || 
           (href !== '/app/dashboard' && location.pathname.startsWith(href));
  };

  const NavItem = ({ item, onClick }) => {
    const current = isCurrentPage(item.href);
    
    return (
      <NavLink
        to={item.href}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            'group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700',
            current || isActive
              ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
              : 'text-gray-700 hover:text-gray-900'
          )
        }
      >
        <item.icon
          className={cn(
            'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
            current
              ? 'text-primary-500'
              : 'text-gray-400 group-hover:text-primary-500'
          )}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <Badge 
                variant={item.badge.variant || 'secondary'} 
                size="sm"
                className="ml-2"
              >
                {item.badge.count}
              </Badge>
            )}
          </div>
          <p className={cn(
            'text-xs mt-1 transition-colors',
            current
              ? 'text-primary-600'
              : 'text-gray-500 group-hover:text-primary-600'
          )}>
            {item.description}
          </p>
        </div>
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 py-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CertChain</h1>
                <p className="text-xs text-gray-500">Certificate Manager</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline-primary" size="sm">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {/* Main Navigation */}
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">
                  Main Navigation
                </div>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <NavItem item={item} />
                    </li>
                  ))}
                </ul>
              </li>

              {/* Bottom Navigation */}
              <li className="mt-auto">
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">
                  Account
                </div>
                <ul role="list" className="-mx-2 space-y-1">
                  {bottomNavigation.map((item) => (
                    <li key={item.name}>
                      <NavItem item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        'relative z-50 lg:hidden',
        open ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={onClose}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 py-4">
              {/* Logo */}
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">CertChain</h1>
                    <p className="text-xs text-gray-500">Certificate Manager</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline-primary" size="sm">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                  {/* Main Navigation */}
                  <li>
                    <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">
                      Main Navigation
                    </div>
                    <ul role="list" className="-mx-2 space-y-1">
                      {filteredNavigation.map((item) => (
                        <li key={item.name}>
                          <NavItem item={item} onClick={onClose} />
                        </li>
                      ))}
                    </ul>
                  </li>

                  {/* Bottom Navigation */}
                  <li className="mt-auto">
                    <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">
                      Account
                    </div>
                    <ul role="list" className="-mx-2 space-y-1">
                      {bottomNavigation.map((item) => (
                        <li key={item.name}>
                          <NavItem item={item} onClick={onClose} />
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;