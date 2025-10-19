'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface Topic {
  _id: string;
  name: string;
  category: string;
  description: string;
  difficulty: string;
  sessionsCount: number;
  averageRating: number;
  isActive: boolean;
}

interface UserStats {
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  topTopics: Array<{
    _id: string;
    name: string;
    category: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [popularTopics, setPopularTopics] = useState<Topic[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTopics();
      fetchPopularTopics();
      fetchUserStats();
    }
  }, [isAuthenticated]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics?limit=6');
      setTopics(response.data.topics);
    } catch (error: any) {
      toast.error('Failed to fetch topics');
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchPopularTopics = async () => {
    try {
      const response = await api.get('/topics/meta/popular');
      setPopularTopics(response.data.popularTopics);
    } catch (error: any) {
      console.error('Failed to fetch popular topics:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/sessions/stats/overview');
      setUserStats(response.data.stats);
    } catch (error: any) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-100';
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'Advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.username}!
              </h1>
              <p className="text-gray-600">Ready to learn something new today?</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/topics"
                className="btn-outline"
              >
                Browse All Topics
              </Link>
              {/* <Link
                href="/session/start"
                className="btn-primary flex items-center"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Start Learning
              </Link> */}
                <Link
                href="/logout"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center transition-colors"
                title="Log out"
                >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Log Out
                </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loadingStats ? '-' : userStats?.totalSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loadingStats ? '-' : userStats?.completedSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loadingStats ? '-' : userStats?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hours Learned</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loadingStats ? '-' : Math.round((userStats?.completedSessions || 0) * 0.5)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Topics */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Explore Topics</h2>
              <Link
                href="/topics"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View all
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {loadingTopics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="card animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map((topic) => (
                  <div
                    key={topic._id}
                    className="card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/topics/${topic._id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                        {topic.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                          topic.difficulty
                        )}`}
                      >
                        {topic.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {topic.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        {topic.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {renderStars(Math.round(topic.averageRating))}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({topic.sessionsCount})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Topics */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Popular Topics
              </h3>
              <div className="space-y-3">
                {popularTopics.slice(0, 5).map((topic, index) => (
                  <div
                    key={topic._id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/topics/${topic._id}`)}
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {topic.name}
                      </p>
                      <p className="text-xs text-gray-500">{topic.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/session/start"
                  className="block w-full btn-primary text-center"
                >
                  Start New Session
                </Link>
                <Link
                  href="/sessions/history"
                  className="block w-full btn-outline text-center"
                >
                  View History
                </Link>
                <Link
                  href="/profile"
                  className="block w-full btn-secondary text-center"
                >
                  Edit Profile
                </Link>
                {/* <Link
                  href="/logout"
                  className="block w-full btn-outline text-center text-red-600 hover:text-red-700 hover:border-red-300 flex items-center justify-center"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Log Out
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}