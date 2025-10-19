'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  StarIcon,
  UserGroupIcon,
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

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    fetchTopics();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterTopics();
  }, [topics, searchTerm, selectedCategory, selectedDifficulty]);

  const fetchTopics = async () => {
    try {
      // Make request without auth headers for public viewing
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/topics?limit=50`);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error: any) {
      console.error('Failed to fetch topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/topics/meta/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const filterTopics = () => {
    let filtered = topics;

    if (searchTerm) {
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(topic => topic.category === selectedCategory);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(topic => topic.difficulty === selectedDifficulty);
    }

    setFilteredTopics(filtered);
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

  if (loading) {
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
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-primary-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Topic Video Learning</span>
              </Link>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Topics</h1>
          <p className="text-gray-600">
            Discover topics you can learn and discuss with other learners. Join now to start your learning journey!
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field pl-10 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="input-field"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <span>{filteredTopics.length} topics found</span>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                  {topic.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${getDifficultyColor(
                    topic.difficulty
                  )}`}
                >
                  {topic.difficulty}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {topic.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                  <span>{topic.sessionsCount} sessions completed</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {renderStars(Math.round(topic.averageRating))}
                    <span className="text-xs text-gray-500 ml-1">
                      ({topic.averageRating.toFixed(1)})
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {topic.category}
                  </span>
                </div>
              </div>

              <Link href="/register" className="btn-primary w-full text-center text-sm">
                Join to Learn This Topic
              </Link>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No topics found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-primary-600 rounded-lg p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-primary-100 mb-6">
            Join thousands of learners and start meaningful conversations about topics you care about.
          </p>
          <Link href="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors">
            Create Your Account
          </Link>
        </div>
      </main>
    </div>
  );
}