import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getNotificationSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-gray-900">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Best Friends Reminder</p>
                <p className="text-sm text-gray-500">Days between reminders</p>
              </div>
              <span className="text-lg font-semibold">{settings?.bestFriendDays || 30} days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Friends Reminder</p>
                <p className="text-sm text-gray-500">Days between reminders</p>
              </div>
              <span className="text-lg font-semibold">{settings?.friendDays || 90} days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Acquaintances Reminder</p>
                <p className="text-sm text-gray-500">Days between reminders</p>
              </div>
              <span className="text-lg font-semibold">{settings?.acquaintanceDays || 180} days</span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings?.enablePushNotifications} className="sr-only peer" readOnly />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};