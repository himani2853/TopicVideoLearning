'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
//   XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function LogoutPage() {
  const { logout, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);

  useEffect(() => {
    // If user is not authenticated, redirect to home
    if (!isAuthenticated && !logoutComplete) {
      router.push('/');
    }
  }, [isAuthenticated, logoutComplete, router]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Perform logout
      logout();
      
      setLogoutComplete(true);
      toast.success('Logged out successfully! See you soon!');
      
      // Redirect to home page after showing success
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      toast.error('Error during logout. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (logoutComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Successfully Logged Out!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Thank you for using Topic Video Learning. You have been securely logged out.
            </p>
            
            <div className="space-y-3">
                <Link
                    href="/"
                    className="btn-primary w-full flex items-center justify-center"
                >
                    Go to Home Page
                </Link>
                
                <Link
                    href="/login"
                    className="btn-outline w-full flex items-center justify-center"
                >
                    Sign In Again
                </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                <ArrowRightOnRectangleIcon className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirm Logout
            </h2>
            
            <p className="text-gray-600">
              Are you sure you want to log out, <span className="font-medium text-gray-900">{user?.username}</span>?
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white">
                  You will be signed out
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your session will be terminated</li>
                    <li>You'll need to sign in again to access your account</li>
                    <li>Any unsaved changes may be lost</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="btn-primary w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              {isLoggingOut ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Logging out...
                </>
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Yes, Log Me Out
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={isLoggingOut}
              className="btn-outline w-full"
            >
              Cancel, Stay Logged In
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              For security reasons, you'll be redirected to the home page after logout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}