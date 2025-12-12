import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Alert variants
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-gray-200",
        success: "border-success-200 bg-success-50 text-success-800 [&>svg]:text-success-600",
        warning: "border-warning-200 bg-warning-50 text-warning-800 [&>svg]:text-warning-600",
        danger: "border-danger-200 bg-danger-50 text-danger-800 [&>svg]:text-danger-600",
        info: "border-primary-200 bg-primary-50 text-primary-800 [&>svg]:text-primary-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Main Alert Component
const Alert = React.forwardRef(({
  className,
  variant,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {children}
  </div>
));

Alert.displayName = "Alert";

// Alert Title Component
const AlertTitle = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h5>
));

AlertTitle.displayName = "AlertTitle";

// Alert Description Component
const AlertDescription = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  >
    {children}
  </div>
));

AlertDescription.displayName = "AlertDescription";

// Success Alert Component
const SuccessAlert = ({ 
  title, 
  children, 
  onClose, 
  className, 
  ...props 
}) => (
  <Alert variant="success" className={cn("relative", className)} {...props}>
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    <div>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-success-100 transition-colors"
        aria-label="Close alert"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </Alert>
);

// Warning Alert Component
const WarningAlert = ({ 
  title, 
  children, 
  onClose, 
  className, 
  ...props 
}) => (
  <Alert variant="warning" className={cn("relative", className)} {...props}>
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <div>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-warning-100 transition-colors"
        aria-label="Close alert"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </Alert>
);

// Danger Alert Component
const DangerAlert = ({ 
  title, 
  children, 
  onClose, 
  className, 
  ...props 
}) => (
  <Alert variant="danger" className={cn("relative", className)} {...props}>
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
    <div>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-danger-100 transition-colors"
        aria-label="Close alert"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </Alert>
);

// Info Alert Component
const InfoAlert = ({ 
  title, 
  children, 
  onClose, 
  className, 
  ...props 
}) => (
  <Alert variant="info" className={cn("relative", className)} {...props}>
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    <div>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-primary-100 transition-colors"
        aria-label="Close alert"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </Alert>
);

// Dismissible Alert Component
const DismissibleAlert = ({ 
  variant = "default",
  title,
  children,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const getIcon = () => {
    const icons = {
      success: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      warning: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      danger: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      info: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    };
    return icons[variant] || null;
  };

  return (
    <Alert 
      variant={variant} 
      className={cn("relative animate-fade-in", className)} 
      {...props}
    >
      {getIcon()}
      <div>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </div>
      <button
        onClick={handleClose}
        className={cn(
          "absolute top-3 right-3 p-1 rounded-md transition-colors",
          variant === "success" && "hover:bg-success-100",
          variant === "warning" && "hover:bg-warning-100",
          variant === "danger" && "hover:bg-danger-100",
          variant === "info" && "hover:bg-primary-100",
          variant === "default" && "hover:bg-gray-100"
        )}
        aria-label="Close alert"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Alert>
  );
};

// Alert with Actions Component
const AlertWithActions = ({
  variant = "default",
  title,
  children,
  actions = [],
  onClose,
  className,
  ...props
}) => {
  const getIcon = () => {
    const icons = {
      success: (
        <svg className="h-5 w-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      warning: (
        <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      danger: (
        <svg className="h-5 w-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      info: (
        <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    };
    return icons[variant] || null;
  };

  return (
    <Alert variant={variant} className={cn("relative", className)} {...props}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm mb-3">{children}</div>
          {actions.length > 0 && (
            <div className="flex space-x-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    "text-sm font-medium underline hover:no-underline transition-all",
                    variant === "success" && "text-success-700 hover:text-success-600",
                    variant === "warning" && "text-warning-700 hover:text-warning-600",
                    variant === "danger" && "text-danger-700 hover:text-danger-600",
                    variant === "info" && "text-primary-700 hover:text-primary-600",
                    variant === "default" && "text-gray-700 hover:text-gray-600"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onClose}
                className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                aria-label="Close alert"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Alert>
  );
};

export {
  Alert,
  AlertTitle,
  AlertDescription,
  SuccessAlert,
  WarningAlert,
  DangerAlert,
  InfoAlert,
  DismissibleAlert,
  AlertWithActions,
  alertVariants
};