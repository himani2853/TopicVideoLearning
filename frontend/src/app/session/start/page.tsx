'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { socketService } from '@/lib/socket';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
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

interface WaitingStats {
  waitingCount: number;
  recentSessions24h: number;
  estimatedWaitTime: number;
}

export default function TopicSelectionPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [waitingStats, setWaitingStats] = useState<Record<string, WaitingStats>>({});
  const [isJoining, setIsJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterTopics();
  }, [topics, searchTerm, selectedCategory, selectedDifficulty]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics?limit=50');
      setTopics(response.data.topics);
      
      // Fetch waiting stats for each topic
      const statsPromises = response.data.topics.map((topic: Topic) =>
        fetchTopicStats(topic._id)
      );
      await Promise.all(statsPromises);
    } catch (error: any) {
      toast.error('Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/topics/meta/categories');
      setCategories(response.data.categories);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTopicStats = async (topicId: string) => {
    try {
      const response = await api.get(`/matching/stats/${topicId}`);
      setWaitingStats(prev => ({
        ...prev,
        [topicId]: response.data
      }));
    } catch (error: any) {
      console.error(`Failed to fetch stats for topic ${topicId}:`, error);
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

  const handleTopicSelect = async (topic: Topic) => {
    if (isJoining) return;

    setIsJoining(topic._id);
    
    try {
      // Connect socket if not connected
      if (!socketService.isConnected()) {
        await socketService.connect();
      }

      // Join waiting pool
      const response = await api.post('/matching/join', {
        topicId: topic._id,
        socketId: socketService.getSocket()?.id
      });

      if (response.data.matched) {
        // Match found immediately
        toast.success('Match found! Redirecting to session...');
        router.push(`/session/${response.data.session._id}`);
      } else {
        // Added to waiting pool
        toast.success(`Joined waiting pool for ${topic.name}`);
        router.push(`/session/waiting/${topic._id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join waiting pool');
    } finally {
      setIsJoining(null);
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

  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime <= 2) return 'text-green-600';
    if (waitTime <= 5) return 'text-yellow-600';
    return 'text-red-600';
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
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Choose a Topic</h1>
            <p className="text-gray-600 mt-1">
              Select a topic you'd like to discuss and we'll match you with another learner
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {filteredTopics.map((topic) => {
            const stats = waitingStats[topic._id];
            const isCurrentlyJoining = isJoining === topic._id;
            
            return (
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
                  
                  {stats && (
                    <>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span className={getWaitTimeColor(stats.estimatedWaitTime)}>
                          ~{stats.estimatedWaitTime} min wait
                        </span>
                      </div>
                      
                      {stats.waitingCount > 0 && (
                        <div className="text-sm text-green-600">
                          {stats.waitingCount} learner{stats.waitingCount > 1 ? 's' : ''} waiting
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    {topic.category}
                  </span>
                  
                  <button
                    onClick={() => handleTopicSelect(topic)}
                    disabled={isCurrentlyJoining}
                    className="btn-primary text-sm px-4 py-2 flex items-center"
                  >
                    {isCurrentlyJoining ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      'Join Session'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
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
      </main>
    </div>
  );
}