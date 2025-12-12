import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Badge variants
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-600 text-white shadow hover:bg-primary-700",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        success: "border-transparent bg-success-600 text-white shadow hover:bg-success-700",
        warning: "border-transparent bg-warning-500 text-white shadow hover:bg-warning-600",
        danger: "border-transparent bg-danger-600 text-white shadow hover:bg-danger-700",
        outline: "border-gray-300 text-gray-700 hover:bg-gray-50",
        "outline-primary": "border-primary-300 text-primary-700 hover:bg-primary-50",
        "outline-success": "border-success-300 text-success-700 hover:bg-success-50",
        "outline-warning": "border-warning-300 text-warning-700 hover:bg-warning-50",
        "outline-danger": "border-danger-300 text-danger-700 hover:bg-danger-50",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-2xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Main Badge Component
const Badge = React.forwardRef(({
  className,
  variant,
  size,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(badgeVariants({ variant, size }), className)}
    {...props}
  >
    {children}
  </div>
));

Badge.displayName = "Badge";

// Status Badge Component
const StatusBadge = ({ status, className, ...props }) => {
  const getStatusConfig = (status) => {
    const configs = {
      // Certificate statuses
      draft: { variant: "outline", text: "Draft", color: "gray" },
      pending_verification: { variant: "warning", text: "Pending Verification", color: "warning" },
      verified: { variant: "success", text: "Verified", color: "success" },
      issued: { variant: "default", text: "Issued", color: "primary" },
      revoked: { variant: "danger", text: "Revoked", color: "danger" },
      
      // General statuses
      active: { variant: "success", text: "Active", color: "success" },
      inactive: { variant: "outline", text: "Inactive", color: "gray" },
      pending: { variant: "warning", text: "Pending", color: "warning" },
      completed: { variant: "success", text: "Completed", color: "success" },
      failed: { variant: "danger", text: "Failed", color: "danger" },
      cancelled: { variant: "outline", text: "Cancelled", color: "gray" },
      
      // User roles
      admin: { variant: "default", text: "Admin", color: "primary" },
      creator: { variant: "outline-primary", text: "Creator", color: "primary" },
      verifier: { variant: "outline-success", text: "Verifier", color: "success" },
      issuer: { variant: "outline-warning", text: "Issuer", color: "warning" },
    };

    return configs[status?.toLowerCase()] || { 
      variant: "outline", 
      text: status || "Unknown", 
      color: "gray" 
    };
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge
      variant={config.variant}
      className={className}
      {...props}
    >
      {config.text}
    </Badge>
  );
};

// Notification Badge Component
const NotificationBadge = ({ count, maxCount = 99, className, ...props }) => {
  if (count === 0 || count === null || count === undefined) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  return (
    <Badge
      variant="danger"
      size="sm"
      className={cn("min-w-[1.25rem] h-5 flex items-center justify-center p-0", className)}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority, className, ...props }) => {
  const getPriorityConfig = (priority) => {
    const configs = {
      low: { variant: "outline-success", text: "Low", icon: "↓" },
      medium: { variant: "outline-warning", text: "Medium", icon: "→" },
      high: { variant: "outline-danger", text: "High", icon: "↑" },
      urgent: { variant: "danger", text: "Urgent", icon: "⚠" },
    };

    return configs[priority?.toLowerCase()] || configs.medium;
  };

  const config = getPriorityConfig(priority);
  
  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1", className)}
      {...props}
    >
      <span className="text-xs">{config.icon}</span>
      {config.text}
    </Badge>
  );
};

// Tag Badge Component
const TagBadge = ({ 
  children, 
  onRemove, 
  removable = false, 
  className, 
  ...props 
}) => (
  <Badge
    variant="secondary"
    className={cn("gap-1", removable && "pr-1", className)}
    {...props}
  >
    {children}
    {removable && onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
        aria-label="Remove tag"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </Badge>
);

// Progress Badge Component
const ProgressBadge = ({ 
  current, 
  total, 
  showPercentage = false, 
  className, 
  ...props 
}) => {
  const percentage = Math.round((current / total) * 100);
  const variant = percentage >= 100 ? "success" : percentage >= 50 ? "warning" : "outline";
  
  return (
    <Badge
      variant={variant}
      className={className}
      {...props}
    >
      {showPercentage ? `${percentage}%` : `${current}/${total}`}
    </Badge>
  );
};

// Icon Badge Component
const IconBadge = ({ 
  icon, 
  children, 
  iconPosition = "left", 
  className, 
  ...props 
}) => (
  <Badge
    className={cn("gap-1", className)}
    {...props}
  >
    {iconPosition === "left" && icon && (
      <span className="w-3 h-3 flex items-center justify-center">
        {icon}
      </span>
    )}
    {children}
    {iconPosition === "right" && icon && (
      <span className="w-3 h-3 flex items-center justify-center">
        {icon}
      </span>
    )}
  </Badge>
);

// Verification Badge Component
const VerificationBadge = ({ 
  verified = false, 
  verifiedText = "Verified", 
  unverifiedText = "Unverified",
  className,
  ...props 
}) => (
  <Badge
    variant={verified ? "success" : "outline"}
    className={cn("gap-1", className)}
    {...props}
  >
    {verified ? (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )}
    {verified ? verifiedText : unverifiedText}
  </Badge>
);

// Badge Group Component
const BadgeGroup = ({ 
  badges = [], 
  maxVisible = 3, 
  className, 
  ...props 
}) => {
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;
  
  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)} {...props}>
      {visibleBadges.map((badge, index) => (
        <Badge key={index} {...badge}>
          {badge.children || badge.text}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" size="sm">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

export {
  Badge,
  StatusBadge,
  NotificationBadge,
  PriorityBadge,
  TagBadge,
  ProgressBadge,
  IconBadge,
  VerificationBadge,
  BadgeGroup,
  badgeVariants
};