import React from 'react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';

const ProfilePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary-600">JD</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">John Doe</h2>
              <p className="text-gray-600">john@example.com</p>
              <Badge variant="success" className="mt-1">Creator</Badge>
            </div>
          </div>

          <div className="text-center py-12">
            <p className="text-gray-500">Profile page coming soon...</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;