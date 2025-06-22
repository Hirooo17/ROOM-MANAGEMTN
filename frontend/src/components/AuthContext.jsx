import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

 // Environment configuration
const API_ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:5000/api',
    timeout: 5000
  },
  production: {
    baseURL: 'https://ccs-backend-production.up.railway.app',
    timeout: 10000
  },
  staging: {
    baseURL: 'https://your-staging-url.com/api',
    timeout: 8000
  }
  // Add more environments as needed
};

// Get current environment (defaults to development if not set)
const currentEnv =  'production';

  const api = axios.create({
  baseURL: API_ENVIRONMENTS[currentEnv].baseURL,
  timeout: API_ENVIRONMENTS[currentEnv].timeout,
  headers: {
    'Content-Type': 'application/json'
    // Add any common headers here
  }
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

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      // First decode the token to get basic user info
      const userData = decodeToken(token);
      if (userData) {
        setUser({
          id: userData.userId || userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role // assuming your token includes role
        });
      }

      // If you need additional professor-specific data
      if (userData?.role === 'professor') {
        const response = await api.get('/professors/get-status');
        setUser(prev => ({ ...prev, status: response.data }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't logout if we have basic user info from token
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
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await api({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body,
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};