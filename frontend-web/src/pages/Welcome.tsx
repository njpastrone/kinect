import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Stay Connected with
            <span className="text-blue-600"> Kinect</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A privacy-first relationship management app that helps you maintain meaningful
            connections with friends and loved ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Manage Contacts
            </h3>
            <p className="text-gray-600">
              Organize your relationships and track when you last connected with each person.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <BellIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Reminders
            </h3>
            <p className="text-gray-600">
              Get timely notifications when it&apos;s time to reach out and stay in touch.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy First
            </h3>
            <p className="text-gray-600">
              Your data stays in your own MongoDB instance. Complete control over your information.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <ClockIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Custom Schedules
            </h3>
            <p className="text-gray-600">
              Set personalized reminder frequencies for different relationships and contact lists.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Never Lose Touch Again
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Life gets busy, but your relationships don&apos;t have to suffer. Kinect helps you
            stay on top of the connections that matter most.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:text-lg transition-colors"
          >
            Start Building Better Relationships
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Kinect. Privacy-first relationship management.</p>
        </div>
      </div>
    </div>
  );
};
