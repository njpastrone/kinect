import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useWelcomeDemo } from '../features/demo/WelcomeDemoContext';
import { useUserJourney } from '../hooks/useUserDetection';
import { useDemoMode } from '../features/demo/DemoMode';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { 
    startWelcomeDemo, 
    onboardingStatus, 
    updateTourPreferences, 
    resetOnboarding, 
    isLoading: onboardingLoading 
  } = useWelcomeDemo();
  const { journeyStage, onboardingProgress } = useUserJourney();
  const { isDemoMode } = useDemoMode();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);
  const handleError = useErrorHandler();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getNotificationSettings();
        setSettings(data);
      } catch (error) {
        handleError(error, 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleUpdateTourPreferences = async (preferences: {
    showTipsAndTricks?: boolean;
    autoStartTours?: boolean;
  }) => {
    try {
      setUpdatingPreferences(true);
      await updateTourPreferences(preferences);
      toast.success('Tour preferences updated');
    } catch (error) {
      handleError(error, 'Failed to update tour preferences');
    } finally {
      setUpdatingPreferences(false);
    }
  };

  const handleResetOnboarding = async () => {
    if (!confirm('Are you sure you want to reset your onboarding progress? This will restart the welcome tour next time you log in.')) {
      return;
    }

    try {
      await resetOnboarding();
      toast.success('Onboarding has been reset');
    } catch (error) {
      handleError(error, 'Failed to reset onboarding');
    }
  };

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
              <p className="mt-1 text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
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
              <span className="text-lg font-semibold">
                {settings?.acquaintanceDays || 180} days
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.enablePushNotifications}
                    className="sr-only peer"
                    readOnly
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome Tour & Onboarding</h2>
          
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Onboarding Progress</span>
              <span className="text-sm text-gray-500">{onboardingProgress}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${onboardingProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Journey stage: {journeyStage}</p>
          </div>

          <div className="space-y-4">
            {/* Tour Preferences */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-gray-900 mb-3">Tour Preferences</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Tips and Tricks</p>
                    <p className="text-sm text-gray-500">Display helpful tips throughout the interface</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onboardingStatus?.tourPreferences?.showTipsAndTricks ?? true}
                      onChange={(e) => handleUpdateTourPreferences({ showTipsAndTricks: e.target.checked })}
                      disabled={updatingPreferences || onboardingLoading || isDemoMode}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-start Tours</p>
                    <p className="text-sm text-gray-500">Automatically start guided tours for new features</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onboardingStatus?.tourPreferences?.autoStartTours ?? true}
                      onChange={(e) => handleUpdateTourPreferences({ autoStartTours: e.target.checked })}
                      disabled={updatingPreferences || onboardingLoading || isDemoMode}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Tour Actions */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Tour Actions</h3>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={startWelcomeDemo}
                  disabled={onboardingLoading || isDemoMode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  Restart Welcome Tour
                </button>

                {!isDemoMode && (
                  <button
                    onClick={handleResetOnboarding}
                    disabled={onboardingLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    Reset All Onboarding
                  </button>
                )}
              </div>

              {isDemoMode && (
                <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  Tour settings are not saved in demo mode. Changes will be lost when you refresh or log out.
                </p>
              )}
            </div>

            {/* Status Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Status Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Welcome Demo:</span>
                  <span className={`ml-2 font-medium ${onboardingStatus?.welcomeDemoCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                    {onboardingStatus?.welcomeDemoCompleted ? 'Completed' : 'Not completed'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Setup Wizard:</span>
                  <span className={`ml-2 font-medium ${onboardingStatus?.setupWizardCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {onboardingStatus?.setupWizardCompleted ? 'Completed' : 'Not available'}
                  </span>
                </div>
                {onboardingStatus?.welcomeDemoCompletedAt && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Completed on:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(onboardingStatus.welcomeDemoCompletedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
