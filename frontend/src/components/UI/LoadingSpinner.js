import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Loading Spinner variants
const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border",
        default: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-2",
        xl: "h-12 w-12 border-4",
        "2xl": "h-16 w-16 border-4",
      },
      color: {
        primary: "text-primary-600",
        white: "text-white",
        gray: "text-gray-600",
        current: "text-current",
      },
    },
    defaultVariants: {
      size: "default",
      color: "primary",
    },
  }
);

// Loading Spinner Component
const LoadingSpinner = ({ size, color, className, ...props }) => (
  <div
    className={cn(spinnerVariants({ size, color }), className)}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <span className="sr-only">Loading...</span>
  </div>
);

// Loading Dots Component
const LoadingDots = ({ className, ...props }) => (
  <div className={cn("flex space-x-1", className)} {...props}>
    <div className="h-2 w-2 bg-current rounded-full animate-pulse"></div>
    <div className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

// Loading Bar Component
const LoadingBar = ({ progress = 0, className, showPercentage = false, ...props }) => (
  <div className={cn("w-full", className)} {...props}>
    <div className="flex justify-between mb-1">
      <span className="text-base font-medium text-primary-700">Loading</span>
      {showPercentage && (
        <span className="text-sm font-medium text-primary-700">{Math.round(progress)}%</span>
      )}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

// Skeleton Loading Component
const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-gray-200",
      className
    )}
    {...props}
  />
);

// Loading Overlay Component
const LoadingOverlay = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  spinnerSize = "lg",
  ...props
}) => (
  <div className={cn("relative", className)} {...props}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="text-center space-y-3">
          <LoadingSpinner size={spinnerSize} />
          {loadingText && (
            <p className="text-sm text-gray-600 font-medium">{loadingText}</p>
          )}
        </div>
      </div>
    )}
  </div>
);

// Pulse Loading Component
const PulseLoader = ({ className, ...props }) => (
  <div className={cn("flex space-x-1", className)} {...props}>
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);

// Full Screen Loading Component
const FullScreenLoading = ({ 
  isLoading,
  title = "Loading...",
  subtitle,
  className,
  ...props 
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50",
        className
      )}
      {...props}
    >
      <div className="text-center space-y-4 max-w-md px-6">
        <LoadingSpinner size="2xl" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Button Loading State Component
const ButtonLoading = ({ 
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  ...props 
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center",
      isLoading && "cursor-not-allowed opacity-70",
      className
    )}
    disabled={isLoading}
    {...props}
  >
    {isLoading && (
      <LoadingSpinner size="sm" className="mr-2" />
    )}
    {isLoading ? loadingText : children}
  </button>
);

// Table Loading Rows Component
const TableLoadingRows = ({ rows = 5, columns = 4, className }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <tr key={i} className={className}>
        {[...Array(columns)].map((_, j) => (
          <td key={j} className="px-6 py-4">
            <Skeleton className="h-4 w-full" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Card Loading Component
const CardLoading = ({ className, ...props }) => (
  <div className={cn("animate-pulse", className)} {...props}>
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  </div>
);

// List Loading Component
const ListLoading = ({ items = 5, className, ...props }) => (
  <div className={cn("space-y-3", className)} {...props}>
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);

// Progressive Loading Component
const ProgressiveLoading = ({
  steps,
  currentStep,
  className,
  ...props
}) => (
  <div className={cn("space-y-4", className)} {...props}>
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div
            className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              index < currentStep
                ? "bg-success-100 text-success-600"
                : index === currentStep
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-400"
            )}
          >
            {index < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                index <= currentStep ? "text-gray-900" : "text-gray-400"
              )}
            >
              {step}
            </p>
          </div>
          {index === currentStep && (
            <LoadingSpinner size="sm" />
          )}
        </div>
      ))}
    </div>
  </div>
);

export {
  LoadingSpinner,
  LoadingDots,
  LoadingBar,
  Skeleton,
  LoadingOverlay,
  PulseLoader,
  FullScreenLoading,
  ButtonLoading,
  TableLoadingRows,
  CardLoading,
  ListLoading,
  ProgressiveLoading,
  spinnerVariants
};