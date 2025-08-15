import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout, hasRole } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Call Grader</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, {user.name}
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard</h2>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* User Info Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">User Information</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900"><strong>Name:</strong> {user.name}</p>
                    <p className="text-sm text-gray-900"><strong>Email:</strong> {user.email}</p>
                    <p className="text-sm text-gray-900"><strong>Company:</strong> {user.company_name}</p>
                    <p className="text-sm text-gray-900"><strong>Roles:</strong> {user.roles?.join(', ') || 'No roles'}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Quick Actions</h3>
                  <div className="mt-2 space-y-2">
                    <Link
                      to="/calls"
                      className="block text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      View Calls
                    </Link>
                    <Link
                      to="/evaluations"
                      className="block text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      View Evaluations
                    </Link>
                    {hasRole('admin') && (
                      <Link
                        to="/admin/users"
                        className="block text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Manage Users
                      </Link>
                    )}
                  </div>
                </div>

                {/* Role-based Features */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Available Features</h3>
                  <div className="mt-2 space-y-1">
                    {hasRole('agent') && (
                      <p className="text-xs text-gray-600">• Upload call recordings</p>
                    )}
                    {hasRole('reviewer') && (
                      <p className="text-xs text-gray-600">• Evaluate calls</p>
                    )}
                    {hasRole('supervisor') && (
                      <p className="text-xs text-gray-600">• View team performance</p>
                    )}
                    {hasRole('admin') && (
                      <p className="text-xs text-gray-600">• Manage users and settings</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Role-specific navigation */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Navigation</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Link
                    to="/calls"
                    className="bg-white border border-gray-300 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">Calls</h4>
                    <p className="text-sm text-gray-500">View and manage call recordings</p>
                  </Link>

                  <Link
                    to="/evaluations"
                    className="bg-white border border-gray-300 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">Evaluations</h4>
                    <p className="text-sm text-gray-500">Review call evaluations</p>
                  </Link>

                  {hasRole('admin') && (
                    <Link
                      to="/admin/users"
                      className="bg-white border border-gray-300 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">User Management</h4>
                      <p className="text-sm text-gray-500">Manage users and permissions</p>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="bg-white border border-gray-300 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">Profile</h4>
                    <p className="text-sm text-gray-500">Update your profile settings</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 