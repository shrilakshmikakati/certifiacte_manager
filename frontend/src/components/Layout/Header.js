import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  BellIcon, 
  ChevronDownIcon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  WalletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../UI/Button';
import { Badge, NotificationBadge } from '../UI/Badge';
import { cn, truncateText } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick, user, web3Connected, walletAddress }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { connectWallet, disconnect, isConnecting, getNetworkName, isOnSupportedNetwork } = useWeb3();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  // Mock notification count - replace with actual data
  const notificationCount = 3;

  const userMenuItems = [
    {
      name: 'Your Profile',
      href: '/app/profile',
      icon: UserIcon,
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: CogIcon,
    },
    {
      name: 'Sign out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search - can be added later */}
        <div className="flex flex-1 items-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Certificate Management
          </h1>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Web3 Wallet Connection */}
          <div className="flex items-center gap-x-3">
            {web3Connected ? (
              <div className="flex items-center gap-x-2">
                <div className="flex items-center gap-x-1">
                  <CheckCircleIcon className="h-4 w-4 text-success-500" />
                  <Badge variant="success" size="sm">
                    Connected
                  </Badge>
                </div>
                <div className="hidden sm:block text-sm text-gray-600">
                  {truncateText(walletAddress, 12)}
                </div>
                {!isOnSupportedNetwork() && (
                  <div className="flex items-center gap-x-1">
                    <ExclamationTriangleIcon className="h-4 w-4 text-warning-500" />
                    <Badge variant="warning" size="sm">
                      Wrong Network
                    </Badge>
                  </div>
                )}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                    <WalletIcon className="h-4 w-4" />
                    <ChevronDownIcon className="h-3 w-3" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3">
                        <p className="text-sm">Connected to</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {walletAddress}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getNetworkName()}
                        </p>
                      </div>
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleDisconnectWallet}
                              className={cn(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block w-full px-4 py-2 text-left text-sm'
                              )}
                            >
                              Disconnect Wallet
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                loading={isConnecting}
                size="sm"
                leftIcon={<WalletIcon className="h-4 w-4" />}
              >
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            {notificationCount > 0 && (
              <NotificationBadge
                count={notificationCount}
                className="absolute -top-1 -right-1"
              />
            )}
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user?.name || user?.email}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <Badge variant="outline-primary" size="sm" className="mt-1">
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                {userMenuItems.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <button
                        onClick={item.onClick || (() => navigate(item.href))}
                        className={cn(
                          active ? 'bg-gray-50' : '',
                          'flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        {item.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;