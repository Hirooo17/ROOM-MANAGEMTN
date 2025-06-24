import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const api = axios.create({
    baseURL: 'https://ccs-backend-production.up.railway.app',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Add request interceptor to include token
  api.interceptors.request.use(config => {
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  // Add response interceptor to handle errors
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  // Initialize Socket.IO after login
  useEffect(() => {
    if (token && user) {
      const socketInstance = io('https://ccs-backend-production.up.railway.app', {
        withCredentials: true,
        transports: ['polling'],
        auth: { token }, // Send token for authentication
        reconnection: true, // Enable reconnection
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket.IO connected:', socketInstance.id);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        console.log('Socket.IO disconnected');
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [token, user]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const userData = decodeToken(token);
      if (userData) {
        setUser({
          id: userData.userId || userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        });
      }

      if (userData?.role === 'professor') {
        const response = await api.get('/professors/get-status');
        setUser(prev => ({ ...prev, status: response.data }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (!user) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password,
      });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await api({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data, // Changed from options.body to match axios
        ...options
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Request failed');
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    apiCall,
    loading,
    socket, // Expose socket for components like Dashboard
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};