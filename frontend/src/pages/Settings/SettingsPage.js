import React from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { CogIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your application preferences
        </p>
      </div>

      <Card>
        <div className="p-6">
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-500 mb-6">Settings page coming soon...</p>
            <Button variant="outline">Configure Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;