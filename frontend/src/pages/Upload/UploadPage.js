import React, { useState, useCallback, useRef } from 'react';
import { 
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import { LoadingSpinner, CircularProgress } from '../../components/UI/LoadingSpinner';
import { Alert } from '../../components/UI/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState(null);

  const acceptedFileTypes = {
    'text/csv': '.csv',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/json': '.json'
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 5;

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Process selected files
  const handleFiles = (selectedFiles) => {
    const newFiles = [];
    const newErrors = [];

    selectedFiles.forEach((file, index) => {
      // Check file count
      if (files.length + newFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file type
      if (!Object.keys(acceptedFileTypes).includes(file.type)) {
        newErrors.push(`${file.name}: Invalid file type. Accepted: ${Object.values(acceptedFileTypes).join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        newErrors.push(`${file.name}: File size exceeds 10MB limit`);
        return;
      }

      // Check for duplicates
      if (files.some(f => f.name === file.name) || newFiles.some(f => f.name === file.name)) {
        newErrors.push(`${file.name}: Duplicate file name`);
        return;
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready', // ready, uploading, success, error, validating
        progress: 0,
        error: null,
        preview: null
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // Clear all files
  const clearAllFiles = () => {
    setFiles([]);
    setUploadProgress({});
    setErrors([]);
    setValidationResults(null);
    setSuccessCount(0);
  };

  // Validate file content
  const validateFile = async (fileData) => {
    // Simulate validation API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasHeaders = fileData.rows && fileData.rows.length > 0 && fileData.rows[0].length > 0;
        const requiredColumns = ['recipientName', 'recipientEmail', 'courseName', 'grade', 'completionDate'];
        const headers = hasHeaders ? fileData.rows[0] : [];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        resolve({
          valid: missingColumns.length === 0,
          rowCount: fileData.rows ? fileData.rows.length - 1 : 0,
          columnCount: headers.length,
          missingColumns,
          duplicateEmails: Math.floor(Math.random() * 3), // Simulate duplicates
          invalidEmails: Math.floor(Math.random() * 2), // Simulate invalid emails
        });
      }, 1500);
    });
  };

  // Process and validate files
  const processFiles = async () => {
    setProcessing(true);
    setValidationResults(null);
    
    const results = [];
    
    for (const fileInfo of files) {
      try {
        // Update status to validating
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'validating' } : f
        ));

        // Read file content
        const content = await readFileContent(fileInfo.file);
        const parsed = parseFileContent(content, fileInfo.type);
        
        // Validate content
        const validation = await validateFile(parsed);
        
        results.push({
          fileName: fileInfo.name,
          ...validation
        });

        // Update status
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { 
            ...f, 
            status: validation.valid ? 'validated' : 'error',
            error: validation.valid ? null : `Missing columns: ${validation.missingColumns.join(', ')}`
          } : f
        ));
        
      } catch (error) {
        results.push({
          fileName: fileInfo.name,
          valid: false,
          error: error.message
        });
        
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'error', error: error.message } : f
        ));
      }
    }
    
    setValidationResults(results);
    setProcessing(false);
  };

  // Read file content
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Parse file content based on type
  const parseFileContent = (content, type) => {
    if (type === 'application/json') {
      return JSON.parse(content);
    } else if (type === 'text/csv' || type.includes('sheet')) {
      // Simple CSV parsing (in real app, use a proper CSV parser)
      const lines = content.split('\n');
      const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
      return { rows };
    }
    throw new Error('Unsupported file type');
  };

  // Upload files to server
  const uploadFiles = async () => {
    const validFiles = files.filter(f => f.status === 'validated');
    if (validFiles.length === 0) return;

    setUploading(true);
    let successfulUploads = 0;

    for (const fileInfo of validFiles) {
      try {
        // Update status
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        // Simulate upload with progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setFiles(prev => prev.map(f => 
            f.id === fileInfo.id ? { ...f, progress } : f
          ));
        }

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update success status
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'success', progress: 100 } : f
        ));
        
        successfulUploads++;
        
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id ? { ...f, status: 'error', error: error.message } : f
        ));
      }
    }

    setSuccessCount(successfulUploads);
    setUploading(false);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-gray-500';
      case 'validating': return 'text-blue-500';
      case 'validated': return 'text-green-500';
      case 'uploading': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const canProcess = files.length > 0 && files.every(f => f.status === 'ready');
  const canUpload = files.some(f => f.status === 'validated');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Certificates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload CSV, Excel, or JSON files to bulk create certificates
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/certificates')}
        >
          Back to Certificates
        </Button>
      </div>

      {/* Upload Instructions */}
      <Alert 
        type="info" 
        title="Upload Guidelines"
        className="border-blue-200 bg-blue-50"
      >
        <div className="text-sm text-blue-700">
          <p className="mb-2">Ensure your file contains the following columns:</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><code className="bg-blue-100 px-1 rounded">recipientName</code> - Full name of the certificate recipient</li>
            <li><code className="bg-blue-100 px-1 rounded">recipientEmail</code> - Valid email address</li>
            <li><code className="bg-blue-100 px-1 rounded">courseName</code> - Name of the course or program</li>
            <li><code className="bg-blue-100 px-1 rounded">grade</code> - Grade or score (e.g., A+, 95%, Pass)</li>
            <li><code className="bg-blue-100 px-1 rounded">completionDate</code> - Date in YYYY-MM-DD format</li>
          </ul>
          <p>Maximum file size: 10MB | Maximum files: {maxFiles} | Supported formats: CSV, Excel (.xls, .xlsx), JSON</p>
        </div>
      </Alert>

      {/* Drop Zone */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <div
          className={cn(
            "relative p-8 text-center cursor-pointer transition-all duration-200",
            dragActive && "border-primary-500 bg-primary-50",
            files.length > 0 && "pb-4"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={Object.values(acceptedFileTypes).join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Upload certificate data'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop files here, or{' '}
              <span className="font-medium text-primary-600">click to browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              CSV, Excel, JSON up to 10MB each
            </p>
          </div>
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Selected Files ({files.length})
              </h3>
              <div className="flex items-center space-x-3">
                {!processing && !uploading && canProcess && (
                  <Button 
                    onClick={processFiles}
                    size="sm"
                  >
                    Validate Files
                  </Button>
                )}
                {!processing && !uploading && canUpload && (
                  <Button 
                    onClick={uploadFiles}
                    size="sm"
                  >
                    Upload Files
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={processing || uploading}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {files.map((fileInfo) => (
                <div key={fileInfo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileInfo.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileInfo.size)}
                        </p>
                        <Badge 
                          variant={fileInfo.status === 'error' ? 'destructive' : 'default'}
                          className={getStatusColor(fileInfo.status)}
                        >
                          {fileInfo.status === 'ready' && 'Ready'}
                          {fileInfo.status === 'validating' && 'Validating...'}
                          {fileInfo.status === 'validated' && 'Validated'}
                          {fileInfo.status === 'uploading' && 'Uploading...'}
                          {fileInfo.status === 'success' && 'Success'}
                          {fileInfo.status === 'error' && 'Error'}
                        </Badge>
                      </div>
                      {fileInfo.error && (
                        <p className="text-sm text-red-600 mt-1">{fileInfo.error}</p>
                      )}
                      {fileInfo.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Uploading...</span>
                            <span className="text-gray-600">{fileInfo.progress}%</span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileInfo.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {fileInfo.status === 'validating' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {fileInfo.status === 'success' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                    {fileInfo.status === 'error' && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeFile(fileInfo.id)}
                      disabled={fileInfo.status === 'uploading'}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h3>
            <div className="space-y-4">
              {validationResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{result.fileName}</h4>
                    {result.valid ? (
                      <Badge variant="success">Valid</Badge>
                    ) : (
                      <Badge variant="destructive">Invalid</Badge>
                    )}
                  </div>
                  
                  {result.valid ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>✓ Found {result.rowCount} certificates to create</p>
                      <p>✓ All required columns present ({result.columnCount} columns)</p>
                      {result.duplicateEmails > 0 && (
                        <p className="text-yellow-600">⚠ {result.duplicateEmails} duplicate email addresses detected</p>
                      )}
                      {result.invalidEmails > 0 && (
                        <p className="text-yellow-600">⚠ {result.invalidEmails} invalid email addresses detected</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      {result.error || `Missing required columns: ${result.missingColumns?.join(', ')}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert type="error" title="Upload Errors" className="border-red-200 bg-red-50">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">{error}</li>
            ))}
          </ul>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => setErrors([])}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Success Message */}
      {successCount > 0 && (
        <Alert type="success" title="Upload Successful" className="border-green-200 bg-green-50">
          <p className="text-sm text-green-700">
            Successfully uploaded {successCount} file{successCount > 1 ? 's' : ''}. 
            Certificates are being processed and will appear in your certificates list shortly.
          </p>
          <div className="mt-3 flex space-x-3">
            <Button 
              size="sm"
              onClick={() => navigate('/app/certificates')}
            >
              View Certificates
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSuccessCount(0);
                clearAllFiles();
              }}
            >
              Upload More
            </Button>
          </div>
        </Alert>
      )}

      {/* Sample File Download */}
      <Card>
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Need a sample file?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download a sample CSV file with the correct format and example data to get started quickly.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => {
                  // Create and download sample CSV
                  const sampleData = [
                    ['recipientName', 'recipientEmail', 'courseName', 'grade', 'completionDate'],
                    ['John Doe', 'john@example.com', 'Advanced React Development', 'A+', '2024-12-08'],
                    ['Jane Smith', 'jane@example.com', 'Blockchain Fundamentals', 'A', '2024-12-07'],
                    ['Mike Johnson', 'mike@example.com', 'Modern UI/UX Design', 'B+', '2024-12-06']
                  ];
                  
                  const csvContent = sampleData.map(row => row.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'certificate_sample.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadPage;