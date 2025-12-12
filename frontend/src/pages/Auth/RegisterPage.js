import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input, SelectInput } from '../../components/UI/Input';
import { Alert } from '../../components/UI/Alert';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Organization
    role: '',
    organization: '',
    organizationType: '',
    departmentSize: '',
    
    // Step 3: Agreement
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  const steps = [
    { id: 1, name: 'Basic Information', description: 'Your personal details' },
    { id: 2, name: 'Organization', description: 'Your organization info' },
    { id: 3, name: 'Complete Setup', description: 'Terms and confirmation' }
  ];

  const roles = [
    { value: 'creator', label: 'Certificate Creator', description: 'Create and manage certificates' },
    { value: 'verifier', label: 'Certificate Verifier', description: 'Review and approve certificates' },
    { value: 'issuer', label: 'Certificate Issuer', description: 'Issue verified certificates' },
    { value: 'admin', label: 'Administrator', description: 'Full system access' }
  ];

  const organizationTypes = [
    { value: 'university', label: 'University/College' },
    { value: 'school', label: 'School/K-12' },
    { value: 'training', label: 'Training Institute' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'government', label: 'Government' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'other', label: 'Other' }
  ];

  const departmentSizes = [
    { value: 'CSE', label: 'CSE' },
    { value: 'CIVIL', label: 'CIVIL' },
    { value: 'ECE', label: 'ECE' },
    { value: 'EEE', label: 'EEE' },
    { value: 'MECH', label: 'MECH' }
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (step === 2) {
      if (!formData.role) errors.role = 'Please select a role';
      if (!formData.organization.trim()) errors.organization = 'Organization name is required';
      if (!formData.organizationType) errors.organizationType = 'Please select organization type';
    }
    
    if (step === 3) {
      if (!formData.agreeTerms) errors.agreeTerms = 'You must agree to the terms';
      if (!formData.agreePrivacy) errors.agreePrivacy = 'You must agree to the privacy policy';
    }
    
    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length === 0) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Mark all fields in current step as touched
      const stepFields = getStepFields(currentStep);
      const newTouched = { ...touched };
      stepFields.forEach(field => {
        newTouched[field] = true;
      });
      setTouched(newTouched);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
      case 2:
        return ['role', 'organization', 'organizationType'];
      case 3:
        return ['agreeTerms', 'agreePrivacy'];
      default:
        return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateStep(3);
    if (Object.keys(errors).length > 0) {
      setTouched(prev => ({ ...prev, agreeTerms: true, agreePrivacy: true }));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Register the user with the backend using AuthContext
      const registrationData = {
        username: `${formData.firstName}${formData.lastName}`.toLowerCase(),
        email: formData.email,
        password: formData.password,
        role: formData.role || 'creator',
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          organization: formData.organization,
          phone: formData.phone || '',
          address: formData.address || ''
        }
      };
      
      // Add wallet address only if provided
      if (formData.walletAddress) {
        registrationData.walletAddress = formData.walletAddress;
      }
      
      const result = await registerUser(registrationData);
      
      if (result.success) {
        navigate('/app/dashboard');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const errors = validateStep(currentStep);
  const canProceed = Object.keys(errors).length === 0;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          error={touched.firstName && errors.firstName}
          placeholder="Enter your first name"
          disabled={loading}
          required
        />
        
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          error={touched.lastName && errors.lastName}
          placeholder="Enter your last name"
          disabled={loading}
          required
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        error={touched.email && errors.email}
        placeholder="Enter your email"
        disabled={loading}
        required
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={touched.password && errors.password}
          placeholder="Create a strong password"
          disabled={loading}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={touched.confirmPassword && errors.confirmPassword}
          placeholder="Confirm your password"
          disabled={loading}
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
        >
          {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Password Requirements */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-2">Password requirements:</p>
        <ul className="space-y-1">
          <li className={cn("flex items-center", formData.password.length >= 8 ? "text-green-600" : "text-gray-500")}>
            <CheckIcon className="h-4 w-4 mr-2" />
            At least 8 characters
          </li>
          <li className={cn("flex items-center", /[A-Z]/.test(formData.password) ? "text-green-600" : "text-gray-500")}>
            <CheckIcon className="h-4 w-4 mr-2" />
            One uppercase letter
          </li>
          <li className={cn("flex items-center", /[0-9]/.test(formData.password) ? "text-green-600" : "text-gray-500")}>
            <CheckIcon className="h-4 w-4 mr-2" />
            One number
          </li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Your Role</label>
        <div className="grid grid-cols-1 gap-3">
          {roles.map((role) => (
            <label key={role.value} className="relative">
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={formData.role === role.value}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="sr-only"
              />
              <div className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-all",
                formData.role === role.value 
                  ? "border-primary-500 bg-primary-50" 
                  : "border-gray-200 hover:border-gray-300"
              )}>
                <div className="flex items-start">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center",
                    formData.role === role.value ? "border-primary-500 bg-primary-500" : "border-gray-300"
                  )}>
                    {formData.role === role.value && (
                      <CheckIcon className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{role.label}</p>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {touched.role && errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role}</p>
        )}
      </div>

      <Input
        label="Organization Name"
        value={formData.organization}
        onChange={(e) => handleInputChange('organization', e.target.value)}
        error={touched.organization && errors.organization}
        placeholder="Enter your organization name"
        disabled={loading}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectInput
          label="Organization Type"
          value={formData.organizationType}
          onChange={(e) => handleInputChange('organizationType', e.target.value)}
          error={touched.organizationType && errors.organizationType}
          options={[{ value: '', label: 'Select organization type' }, ...organizationTypes]}
          required
        />
        
        <SelectInput
          label="Department Size"
          value={formData.departmentSize}
          onChange={(e) => handleInputChange('departmentSize', e.target.value)}
          options={[{ value: '', label: 'Select department size' }, ...departmentSizes]}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Account Summary</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-600">Name:</span> {formData.firstName} {formData.lastName}</p>
          <p><span className="text-gray-600">Email:</span> {formData.email}</p>
          <p><span className="text-gray-600">Role:</span> {roles.find(r => r.value === formData.role)?.label}</p>
          <p><span className="text-gray-600">Organization:</span> {formData.organization}</p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary-600 mt-1"
          />
          <span className="ml-3 text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">End User License Agreement</a>
          </span>
        </label>
        {touched.agreeTerms && errors.agreeTerms && (
          <p className="text-sm text-red-600 ml-7">{errors.agreeTerms}</p>
        )}

        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.agreePrivacy}
            onChange={(e) => handleInputChange('agreePrivacy', e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary-600 mt-1"
          />
          <span className="ml-3 text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">Privacy Policy</a>
            {' '}and consent to the processing of my personal data
          </span>
        </label>
        {touched.agreePrivacy && errors.agreePrivacy && (
          <p className="text-sm text-red-600 ml-7">{errors.agreePrivacy}</p>
        )}

        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.agreeMarketing}
            onChange={(e) => handleInputChange('agreeMarketing', e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary-600 mt-1"
          />
          <span className="ml-3 text-sm text-gray-700">
            I would like to receive marketing communications and product updates (optional)
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join thousands of organizations using CertManager</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep >= step.id 
                      ? "bg-primary-600 text-white" 
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {currentStep > step.id ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-px mx-4 transition-colors",
                    currentStep > step.id ? "bg-primary-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="mx-4 sm:mx-0 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="p-8">
            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={currentStep === 1 ? 'ml-auto' : ''}
                  >
                    Next
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!canProceed || loading}
                    loading={loading}
                    className="ml-auto"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <CheckIcon className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;