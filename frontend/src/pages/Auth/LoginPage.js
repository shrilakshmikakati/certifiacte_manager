import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Alert } from '../../components/UI/Alert';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { cn } from '../../utils/cn';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { connectWallet, isConnected, account } = useWeb3();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    // Mark field as touched
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock login validation
      if (formData.email === 'admin@example.com' && formData.password === 'password') {
        await login({
          id: '1',
          name: 'John Doe',
          email: formData.email,
          role: 'creator',
          organization: 'Tech Academy'
        });
        navigate('/app/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWeb3Login = async () => {
    try {
      const walletAccount = await connectWallet();
      if (walletAccount) {
        // In a real app, you'd verify the wallet signature
        await login({
          id: '1',
          name: 'Web3 User',
          email: 'web3@example.com',
          role: 'creator',
          organization: 'Blockchain Institute',
          walletAddress: walletAccount
        });
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const errors = validateForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your CertManager account</p>
        </div>

        {/* Login Form */}
        <Card className="mx-4 sm:mx-0 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="p-8">
            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={touched.email && errors.email}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={touched.password && errors.password}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary-600 rounded"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || Object.keys(errors).length > 0}
                loading={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Web3 Login */}
            <Button
              variant="outline"
              onClick={handleWeb3Login}
              className="w-full"
              disabled={loading}
            >
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              {isConnected ? `Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` : 'Connect Wallet'}
            </Button>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Email:</strong> admin@example.com</p>
                <p><strong>Password:</strong> password</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 max-w-2xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="text-sm">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              </div>
              <p className="font-medium text-gray-900">Blockchain Security</p>
              <p className="text-gray-500 text-xs mt-1">Tamper-proof certificates</p>
            </div>
            
            <div className="text-sm">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AcademicCapIcon className="h-5 w-5 text-secondary-600" />
              </div>
              <p className="font-medium text-gray-900">Easy Management</p>
              <p className="text-gray-500 text-xs mt-1">Intuitive workflow</p>
            </div>
            
            <div className="text-sm">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">Instant Verification</p>
              <p className="text-gray-500 text-xs mt-1">Real-time validation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;