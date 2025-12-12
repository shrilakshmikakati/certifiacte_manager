import React, { useState, forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Input variants
const inputVariants = cva(
  "flex w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus-visible:ring-primary-500 focus-visible:border-primary-500 hover:border-gray-400",
        error: "border-danger-300 focus-visible:ring-danger-500 focus-visible:border-danger-500 bg-danger-50",
        success: "border-success-300 focus-visible:ring-success-500 focus-visible:border-success-500 bg-success-50",
        ghost: "border-transparent bg-gray-50 focus-visible:ring-primary-500 focus-visible:border-primary-500 focus-visible:bg-white",
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 text-xs",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

// Base Input Component
const Input = forwardRef(({
  className,
  variant,
  inputSize,
  type = "text",
  error,
  success,
  ...props
}, ref) => {
  // Determine variant based on error/success state
  const currentVariant = error ? 'error' : success ? 'success' : variant;

  return (
    <input
      type={type}
      className={cn(inputVariants({ variant: currentVariant, inputSize, className }))}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

// Input with Label Component
const InputGroup = forwardRef(({
  label,
  error,
  success,
  helper,
  required,
  className,
  children,
  ...props
}, ref) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      {React.isValidElement(children) ? (
        React.cloneElement(children, { ref, error: !!error, success: !!success, ...props })
      ) : (
        <Input ref={ref} error={!!error} success={!!success} {...props} />
      )}
      
      {(error || success || helper) && (
        <div className="space-y-1">
          {error && (
            <p className="text-sm text-danger-600 flex items-center">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-success-600 flex items-center">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </p>
          )}
          {helper && !error && !success && (
            <p className="text-sm text-gray-500">{helper}</p>
          )}
        </div>
      )}
    </div>
  );
});

InputGroup.displayName = "InputGroup";

// Password Input Component
const PasswordInput = forwardRef(({
  className,
  showToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

// Textarea Component
const Textarea = forwardRef(({
  className,
  variant,
  inputSize,
  error,
  success,
  rows = 4,
  resize = true,
  ...props
}, ref) => {
  const currentVariant = error ? 'error' : success ? 'success' : variant;

  return (
    <textarea
      className={cn(
        inputVariants({ variant: currentVariant, inputSize }),
        resize ? "resize-y" : "resize-none",
        "min-h-[80px]",
        className
      )}
      rows={rows}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

// Search Input Component
const SearchInput = forwardRef(({
  placeholder = "Search...",
  className,
  onClear,
  showClearButton = true,
  leftIcon,
  ...props
}, ref) => {
  const [value, setValue] = useState(props.defaultValue || '');

  const handleClear = () => {
    setValue('');
    if (onClear) onClear();
    if (props.onChange) {
      props.onChange({ target: { value: '' } });
    }
  };

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400 w-5 h-5">
            {leftIcon}
          </div>
        </div>
      )}
      
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        className={cn(
          leftIcon && "pl-10",
          showClearButton && value && "pr-10",
          className
        )}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        {...props}
      />
      
      {showClearButton && value && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          onClick={handleClear}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";

// Input with Icon Component
const InputWithIcon = forwardRef(({
  leftIcon,
  rightIcon,
  className,
  ...props
}, ref) => {
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <div className="text-gray-400 w-5 h-5">
            {leftIcon}
          </div>
        </div>
      )}
      
      <Input
        ref={ref}
        className={cn(
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          className
        )}
        {...props}
      />
      
      {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <div className="text-gray-400 w-5 h-5">
            {rightIcon}
          </div>
        </div>
      )}
    </div>
  );
});

InputWithIcon.displayName = "InputWithIcon";

// DateInput Component
export const DateInput = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className, 
  variant = 'default',
  inputSize = 'default',
  required = false,
  ...props 
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type="date"
        className={cn(
          inputVariants({ 
            variant: error ? 'error' : variant, 
            inputSize 
          }),
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <div className="flex items-center mt-1">
          {error && <p className="text-sm text-danger-600">{error}</p>}
          {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
        </div>
      )}
    </div>
  );
});

DateInput.displayName = 'DateInput';

// SelectInput Component
export const SelectInput = forwardRef(({ 
  label, 
  error, 
  helperText, 
  options = [], 
  placeholder,
  className, 
  variant = 'default',
  inputSize = 'default',
  required = false,
  ...props 
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          inputVariants({ 
            variant: error ? 'error' : variant, 
            inputSize 
          }),
          "pr-10", // Extra padding for dropdown arrow
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <div className="flex items-center mt-1">
          {error && <p className="text-sm text-danger-600">{error}</p>}
          {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
        </div>
      )}
    </div>
  );
});

SelectInput.displayName = 'SelectInput';

// FileInput Component (enhanced)
export const FileInput = forwardRef(({ 
  label, 
  error, 
  helperText, 
  multiple = false,
  accept,
  onChange,
  children,
  className,
  required = false,
  ...props 
}, ref) => {
  const handleChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0];
    onChange?.(files);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <label className={cn(
        "relative cursor-pointer inline-block",
        className
      )}>
        <input
          ref={ref}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        {children || (
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200">
            Choose File{multiple ? 's' : ''}
          </span>
        )}
      </label>
      {(error || helperText) && (
        <div className="flex items-center mt-1">
          {error && <p className="text-sm text-danger-600">{error}</p>}
          {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
        </div>
      )}
    </div>
  );
});

FileInput.displayName = 'FileInput';

export {
  Input,
  InputGroup,
  PasswordInput,
  Textarea,
  SearchInput,
  InputWithIcon,
  DateInput,
  SelectInput,
  FileInput,
  inputVariants
};