'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { socketService } from '@/lib/socket';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'learner' | 'mentor';
  isActive: boolean;
  lastSeen: string;
  sessionsCompleted: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      // Only update if not already authenticated to prevent unnecessary re-renders
      if (state.isAuthenticated && state.user?._id === action.payload._id) {
        return state;
      }
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload, // Only set error if payload is not null
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = Cookies.get('token');
    if (!token) {
      // Simply set loading to false without error for missing token
      dispatch({ type: 'LOGOUT' }); // This sets isLoading to false and isAuthenticated to false
      return;
    }

    try {
      dispatch({ type: 'AUTH_START' });
      const response = await api.get('/auth/verify');
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      
      // Connect socket after successful auth
      try {
        await socketService.connect();
      } catch (socketError) {
        console.error('Socket connection failed:', socketError);
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Authentication failed' });
      Cookies.remove('token');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting login...');
      dispatch({ type: 'AUTH_START' });
      const response = await api.post('/auth/login', { email, password });
      
      console.log('AuthContext: Login API response:', response.data);
      const { token, user } = response.data;
      Cookies.set('token', token, { expires: 7 }); // 7 days
      
      console.log('AuthContext: Dispatching AUTH_SUCCESS with user:', user);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      
      console.log('AuthContext: Login completed successfully');
      
      // Connect socket after successful login
      try {
        await socketService.connect();
      } catch (socketError) {
        console.error('Socket connection failed:', socketError);
      }
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Login failed' });
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, role = 'learner') => {
    try {
      console.log('AuthContext: Starting registration...');
      dispatch({ type: 'AUTH_START' });
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        role,
      });
      
      console.log('AuthContext: Registration API response:', response.data);
      const { token, user } = response.data;
      Cookies.set('token', token, { expires: 7 }); // 7 days
      
      console.log('AuthContext: Dispatching AUTH_SUCCESS with user:', user);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      
      console.log('AuthContext: Registration completed successfully');
      
      // Connect socket after successful registration
      try {
        await socketService.connect();
      } catch (socketError) {
        console.error('Socket connection failed:', socketError);
      }
    } catch (error: any) {
      console.error('AuthContext: Registration failed:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Registration failed' });
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('token');
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put('/auth/profile', data);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;