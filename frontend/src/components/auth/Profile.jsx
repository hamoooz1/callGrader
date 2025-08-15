import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const onSubmitProfile = async (data) => {
    const result = await updateProfile(data.name, data.email);
    if (result.success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(result.error);
    }
  };

  const onSubmitPassword = async (data) => {
    const result = await changePassword(data.currentPassword, data.newPassword);
    if (result.success) {
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
    } else {
      toast.error(result.error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Settings</h2>

            {/* Profile Information */}
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">Personal Information</h3>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Update Profile
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Change Password</h3>
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Change Password
                </button>
              ) : (
                <PasswordForm onSubmit={onSubmitPassword} onCancel={() => setShowPasswordForm(false)} />
              )}
            </div>

            {/* Account Information */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-sm text-gray-900">{user.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Roles</p>
                    <p className="text-sm text-gray-900">{user.roles?.join(', ') || 'No roles'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Status</p>
                    <p className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                    <p className="text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordForm = ({ onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const newPassword = watch('newPassword');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Current Password</label>
        <input
          {...register('currentPassword', { required: 'Current password is required' })}
          type="password"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <input
          {...register('newPassword', { 
            required: 'New password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
          type="password"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input
          {...register('confirmPassword', { 
            required: 'Please confirm your password',
            validate: value => value === newPassword || 'Passwords do not match'
          })}
          type="password"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>
      <div className="flex space-x-3">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Change Password
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default Profile; 