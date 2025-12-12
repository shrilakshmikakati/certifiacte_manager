import { apiRequest, endpoints, setAuthToken } from './api';
import { jwtDecode } from 'jwt-decode';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = null;
    
    // Initialize token if exists
    if (this.token && this.isTokenValid(this.token)) {
      setAuthToken(this.token);
    } else {
      this.removeToken();
    }
  }

  // Check if token is valid
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Set token
  setToken(token) {
    this.token = token;
    setAuthToken(token);
  }

  // Remove token
  removeToken() {
    this.token = null;
    this.user = null;
    setAuthToken(null);
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Get decoded token data
  getTokenData() {
    if (!this.token || !this.isTokenValid(this.token)) {
      return null;
    }
    
    try {
      return jwtDecode(this.token);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // Login
  async login(credentials) {
    try {
      const response = await apiRequest.post(endpoints.auth.login, credentials);
      
      if (response.success && response.token) {
        this.setToken(response.token);
        this.user = response.user;
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await apiRequest.post(endpoints.auth.register, userData);
      
      if (response.success && response.token) {
        this.setToken(response.token);
        this.user = response.user;
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Call logout endpoint to invalidate server-side session
      if (this.token) {
        await apiRequest.post(endpoints.auth.logout);
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if server call fails
    } finally {
      this.removeToken();
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await apiRequest.get(endpoints.auth.profile);
      
      if (response.success) {
        this.user = response.user;
        return response.user;
      } else {
        throw new Error(response.message || 'Failed to get profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await apiRequest.put(endpoints.auth.updateProfile, userData);
      
      if (response.success) {
        this.user = response.user;
        return response.user;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiRequest.post(endpoints.auth.changePassword, passwordData);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiRequest.post(endpoints.auth.refreshToken);
      
      if (response.success && response.token) {
        this.setToken(response.token);
        return response;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.removeToken(); // Clear invalid token
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.token && this.isTokenValid(this.token);
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get user ID from token
  getUserId() {
    const tokenData = this.getTokenData();
    return tokenData?.userId || tokenData?.sub || null;
  }

  // Get user role
  getUserRole() {
    return this.user?.role || null;
  }

  // Check if user has specific role
  hasRole(role) {
    return this.getUserRole() === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }

  // Get user permissions based on role
  getPermissions() {
    const role = this.getUserRole();
    if (!role) return [];

    const rolePermissions = {
      creator: ['create', 'read', 'update'],
      verifier: ['read', 'verify', 'update'],
      issuer: ['read', 'issue', 'revoke'],
      admin: ['create', 'read', 'update', 'delete', 'verify', 'issue', 'revoke']
    };

    return rolePermissions[role] || [];
  }

  // Check if user has specific permission
  hasPermission(permission) {
    const userPermissions = this.getPermissions();
    return userPermissions.includes(permission);
  }

  // Auto-refresh token before it expires
  setupTokenRefresh() {
    if (!this.token || !this.isTokenValid(this.token)) {
      return;
    }

    try {
      const decoded = jwtDecode(this.token);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Refresh token 5 minutes before expiration
      const refreshTime = timeUntilExpiration - (5 * 60 * 1000);
      
      if (refreshTime > 0) {
        setTimeout(async () => {
          try {
            await this.refreshToken();
            this.setupTokenRefresh(); // Setup next refresh
          } catch (error) {
            console.error('Auto token refresh failed:', error);
            // Token refresh failed, user will need to login again
          }
        }, refreshTime);
      }
    } catch (error) {
      console.error('Token refresh setup error:', error);
    }
  }

  // Validate password strength
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Format user data for API requests
  formatUserData(userData) {
    const formatted = { ...userData };
    
    // Remove empty fields
    Object.keys(formatted).forEach(key => {
      if (formatted[key] === '' || formatted[key] === null || formatted[key] === undefined) {
        delete formatted[key];
      }
    });
    
    // Trim string values
    Object.keys(formatted).forEach(key => {
      if (typeof formatted[key] === 'string') {
        formatted[key] = formatted[key].trim();
      }
    });
    
    return formatted;
  }
}

// Create and export singleton instance
const authService = new AuthService();

// Setup auto token refresh
authService.setupTokenRefresh();

export { authService };
export default authService;