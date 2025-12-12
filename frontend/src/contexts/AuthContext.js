import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AuthActionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AuthActionTypes.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AuthActionTypes.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case AuthActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    
    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Helper function to check if token is valid
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token && isTokenValid(token)) {
        try {
          dispatch({ type: AuthActionTypes.AUTH_START });
          
          // Set token in auth service
          authService.setToken(token);
          
          // Get user profile
          const userData = await authService.getProfile();
          
          dispatch({
            type: AuthActionTypes.AUTH_SUCCESS,
            payload: { user: userData, token }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          authService.removeToken();
          dispatch({
            type: AuthActionTypes.AUTH_FAILURE,
            payload: error.message || 'Authentication failed'
          });
        }
      } else {
        localStorage.removeItem('token');
        authService.removeToken();
        dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AuthActionTypes.AUTH_START });
      
      const response = await authService.login(credentials);
      const { token, user } = response;
      
      // Store token
      localStorage.setItem('token', token);
      authService.setToken(token);
      
      dispatch({
        type: AuthActionTypes.AUTH_SUCCESS,
        payload: { user, token }
      });
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({
        type: AuthActionTypes.AUTH_FAILURE,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActionTypes.AUTH_START });
      
      const response = await authService.register(userData);
      const { token, user } = response;
      
      // Store token
      localStorage.setItem('token', token);
      authService.setToken(token);
      
      dispatch({
        type: AuthActionTypes.AUTH_SUCCESS,
        payload: { user, token }
      });
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({
        type: AuthActionTypes.AUTH_FAILURE,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      authService.removeToken();
      dispatch({ type: AuthActionTypes.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateUser = async (updatedData) => {
    try {
      const updatedUser = await authService.updateProfile(updatedData);
      dispatch({
        type: AuthActionTypes.UPDATE_USER,
        payload: updatedUser
      });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    return state.user?.role === requiredRole;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  // Get user permissions
  const getPermissions = () => {
    if (!state.user?.role) return [];
    
    const rolePermissions = {
      creator: ['create', 'read', 'update'],
      verifier: ['read', 'verify', 'update'],
      issuer: ['read', 'issue', 'revoke'],
      admin: ['create', 'read', 'update', 'delete', 'verify', 'issue', 'revoke']
    };
    
    return rolePermissions[state.user.role] || [];
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const userPermissions = getPermissions();
    return userPermissions.includes(permission);
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
    hasPermission,
    getPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;