import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  PlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input, Textarea, DateInput, SelectInput, FileInput } from '../../components/UI/Input';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Alert } from '../../components/UI/Alert';
import { Badge } from '../../components/UI/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const CertificateFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [formData, setFormData] = useState({
    // Basic Information
    recipientName: '',
    recipientEmail: '',
    courseName: '',
    courseDescription: '',
    issuerName: user?.organization || '',
    issuerEmail: user?.email || '',
    
    // Assessment Details
    grade: '',
    score: '',
    completionDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    
    // Course Metadata
    duration: '',
    instructor: '',
    credits: '',
    skills: [],
    
    // Files
    attachments: [],
    
    // Advanced Settings
    template: 'default',
    language: 'en',
    sendEmail: true,
    autoIssue: false
  });

  const [skillInput, setSkillInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Load certificate data for editing
  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      // Simulate API call to fetch certificate data
      setTimeout(() => {
        setFormData({
          recipientName: 'John Doe',
          recipientEmail: 'john@example.com',
          courseName: 'Advanced React Development',
          courseDescription: 'Comprehensive course covering advanced React patterns, hooks, state management, and performance optimization.',
          issuerName: 'Tech Academy',
          issuerEmail: 'academy@tech.com',
          grade: 'A+',
          score: '95',
          completionDate: '2024-12-08',
          issueDate: '2024-12-10',
          expiryDate: '',
          duration: '40 hours',
          instructor: 'Dr. Sarah Tech',
          credits: '3',
          skills: ['React', 'TypeScript', 'State Management', 'Performance Optimization'],
          attachments: [],
          template: 'default',
          language: 'en',
          sendEmail: true,
          autoIssue: false
        });
        setLoading(false);
      }, 1000);
    }
  }, [isEditing]);

  const validateField = (name, value) => {
    switch (name) {
      case 'recipientName':
        return !value.trim() ? 'Recipient name is required' : '';
      case 'recipientEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) return 'Recipient email is required';
        return !emailRegex.test(value) ? 'Invalid email format' : '';
      case 'courseName':
        return !value.trim() ? 'Course name is required' : '';
      case 'grade':
        return !value.trim() ? 'Grade is required' : '';
      case 'completionDate':
        return !value ? 'Completion date is required' : '';
      case 'issueDate':
        return !value ? 'Issue date is required' : '';
      case 'score':
        if (value && (isNaN(value) || value < 0 || value > 100)) {
          return 'Score must be a number between 0 and 100';
        }
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkillAdd();
    }
  };

  const handleFileUpload = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploading: false,
      uploaded: false,
      error: null
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));
  };

  const removeFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(f => f.id !== fileId)
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['recipientName', 'recipientEmail', 'courseName', 'grade', 'completionDate', 'issueDate'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Mark all required fields as touched to show errors
      const requiredFields = ['recipientName', 'recipientEmail', 'courseName', 'grade', 'completionDate', 'issueDate'];
      const newTouched = {};
      requiredFields.forEach(field => {
        newTouched[field] = true;
      });
      setTouched(newTouched);
      return;
    }

    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to certificates list
      navigate('/app/certificates');
    } catch (error) {
      console.error('Error saving certificate:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate back with success message
      navigate('/app/certificates');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/app/certificates')}
            className="p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Certificate' : 'Create New Certificate'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Update certificate information' : 'Fill in the details to create a new certificate'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Recipient Name *"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    error={touched.recipientName && errors.recipientName}
                    placeholder="Enter full name"
                  />
                  
                  <Input
                    label="Recipient Email *"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    error={touched.recipientEmail && errors.recipientEmail}
                    placeholder="Enter email address"
                  />
                  
                  <Input
                    label="Course Name *"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    error={touched.courseName && errors.courseName}
                    placeholder="Enter course name"
                  />
                  
                  <Input
                    label="Issuer Name"
                    value={formData.issuerName}
                    onChange={(e) => handleInputChange('issuerName', e.target.value)}
                    placeholder="Enter issuer organization"
                  />
                </div>
                
                <div className="mt-6">
                  <Textarea
                    label="Course Description"
                    value={formData.courseDescription}
                    onChange={(e) => handleInputChange('courseDescription', e.target.value)}
                    placeholder="Describe the course content and objectives"
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Assessment Details */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Assessment Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Grade *"
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    error={touched.grade && errors.grade}
                    placeholder="e.g., A+, B, Pass"
                  />
                  
                  <Input
                    label="Score (0-100)"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => handleInputChange('score', e.target.value)}
                    error={touched.score && errors.score}
                    placeholder="Enter numerical score"
                  />
                  
                  <DateInput
                    label="Completion Date *"
                    value={formData.completionDate}
                    onChange={(e) => handleInputChange('completionDate', e.target.value)}
                    error={touched.completionDate && errors.completionDate}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <DateInput
                    label="Issue Date *"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    error={touched.issueDate && errors.issueDate}
                  />
                  
                  <DateInput
                    label="Expiry Date (Optional)"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    min={formData.issueDate}
                  />
                </div>
              </div>
            </Card>

            {/* Course Metadata */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Course Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="e.g., 40 hours, 3 months"
                  />
                  
                  <Input
                    label="Instructor"
                    value={formData.instructor}
                    onChange={(e) => handleInputChange('instructor', e.target.value)}
                    placeholder="Enter instructor name"
                  />
                  
                  <Input
                    label="Credits"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => handleInputChange('credits', e.target.value)}
                    placeholder="Enter credit hours"
                  />
                </div>
                
                {/* Skills */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills & Competencies
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter a skill"
                      className="flex-1"
                    />
                    <Button 
                      type="button"
                      onClick={handleSkillAdd}
                      disabled={!skillInput.trim()}
                      className="px-4"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleSkillRemove(skill)}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* File Attachments */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">File Attachments</h3>
                
                {/* Drop Zone */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDrag}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                >
                  <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Drag and drop files here, or{' '}
                      <FileInput
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={(files) => handleFileUpload(files)}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        browse
                      </FileInput>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, JPG, PNG up to 10MB each
                    </p>
                  </div>
                </div>
                
                {/* File List */}
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full"
                    loading={saving}
                  >
                    {isEditing ? 'Update Certificate' : 'Create Certificate'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    onClick={handleSaveAsDraft}
                    disabled={saving}
                  >
                    Save as Draft
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate('/app/certificates')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                <div className="space-y-4">
                  <SelectInput
                    label="Template"
                    value={formData.template}
                    onChange={(e) => handleInputChange('template', e.target.value)}
                    options={[
                      { value: 'default', label: 'Default Template' },
                      { value: 'modern', label: 'Modern Template' },
                      { value: 'classic', label: 'Classic Template' },
                      { value: 'minimal', label: 'Minimal Template' }
                    ]}
                  />
                  
                  <SelectInput
                    label="Language"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' }
                    ]}
                  />
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.sendEmail}
                        onChange={(e) => handleInputChange('sendEmail', e.target.checked)}
                        className="form-checkbox h-4 w-4 text-primary-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Send email to recipient</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.autoIssue}
                        onChange={(e) => handleInputChange('autoIssue', e.target.checked)}
                        className="form-checkbox h-4 w-4 text-primary-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-issue after verification</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help */}
            <Card>
              <div className="p-6">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="h-6 w-6 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Need Help?</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Fields marked with * are required. The certificate will go through verification before being issued.
                    </p>
                    <Button 
                      variant="link" 
                      className="text-sm p-0 mt-2 h-auto"
                    >
                      View documentation
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CertificateFormPage;