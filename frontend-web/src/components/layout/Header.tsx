import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
              Kinect
            </Link>
          </div>

          <nav className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
            <Link to="/contacts" className="text-gray-700 hover:text-blue-600">
              Contacts
            </Link>
            <Link to="/lists" className="text-gray-700 hover:text-blue-600">
              Lists
            </Link>
            <Link to="/settings" className="text-gray-700 hover:text-blue-600">
              Settings
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-gray-700">
                {user.firstName} {user.lastName}
              </span>
            )}
            <button onClick={logout} className="text-gray-500 hover:text-gray-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
