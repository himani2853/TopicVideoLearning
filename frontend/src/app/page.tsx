'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  AcademicCapIcon,
  UserGroupIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Topic Video Learning</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-outline">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Learn Together Through
            <span className="text-primary-600 block">Video Conversations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with fellow learners worldwide through video chat to discuss specific topics. 
            Share knowledge, ask questions, and grow together in a collaborative learning environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register" className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2">
              <span>Start Learning Now</span>
              {/* <ArrowRightIcon className="h-5 w-5 stroke-4" /> */}
            </Link>
            <Link href="/topics" className="btn-outline text-lg px-8 py-3">
              Browse Topics
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-gray-600">Get matched with learners who share your interests and learning goals.</p>
          </div>

          <div className="text-center">
            <div className="bg-success-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <VideoCameraIcon className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Chat</h3>
            <p className="text-gray-600">High-quality video calls to facilitate meaningful learning conversations.</p>
          </div>

          <div className="text-center">
            <div className="bg-warning-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AcademicCapIcon className="h-8 w-8 text-warning-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Diverse Topics</h3>
            <p className="text-gray-600">From programming to languages, explore a wide range of learning topics.</p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Chat</h3>
            <p className="text-gray-600">Text chat during sessions to share links, notes, and additional resources.</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose a Topic</h3>
              <p className="text-gray-600">Select from hundreds of topics or suggest your own learning interest.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Matched</h3>
              <p className="text-gray-600">Our system finds you a learning partner with similar interests.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Learning</h3>
              <p className="text-gray-600">Begin your video conversation and learn together!</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of learners already connecting and growing together.
          </p>
          <Link href="/register" className="btn-primary text-lg px-8 py-3 items-center justify-center gap-2">
            Create Your Account
            {/* <ArrowRightIcon className="ml-2 h-5 w-5" /> */}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <AcademicCapIcon className="h-8 w-8 text-primary-400 mr-3" />
              <span className="text-xl font-bold">Topic Video Learning</span>
            </div>
            <p className="text-gray-400">
              Connecting learners worldwide through meaningful conversations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}