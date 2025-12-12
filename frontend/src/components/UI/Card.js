import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Card variants
const cardVariants = cva(
  "rounded-xl bg-white border border-gray-200 shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 shadow-sm hover:shadow-md",
        elevated: "bg-white border-gray-200 shadow-lg hover:shadow-xl",
        outline: "bg-white border-2 border-gray-300 shadow-none hover:border-gray-400",
        ghost: "bg-gray-50 border-gray-100 shadow-none hover:bg-gray-100",
        gradient: "bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg",
        glassmorphism: "bg-white/80 backdrop-blur-md border-white/20 shadow-lg",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        glow: "hover:ring-2 hover:ring-primary-200 hover:ring-offset-2",
        scale: "hover:scale-[1.02]",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      padding: "default",
    },
  }
);

// Main Card Component
const Card = React.forwardRef(({
  className,
  variant,
  hover,
  padding,
  children,
  onClick,
  ...props
}, ref) => {
  const isClickable = !!onClick;
  
  return (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, hover, padding }),
        isClickable && "cursor-pointer select-none",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

// Card Header Component
const CardHeader = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-6", className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = "CardHeader";

// Card Title Component
const CardTitle = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight text-gray-900", className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = "CardTitle";

// Card Description Component
const CardDescription = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = "CardDescription";

// Card Content Component
const CardContent = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("pb-6", className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = "CardContent";

// Card Footer Component
const CardFooter = React.forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6 border-t border-gray-100", className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = "CardFooter";

// Stats Card Component
const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = "primary",
  className,
  ...props
}) => {
  const colorClasses = {
    primary: "text-primary-600 bg-primary-100",
    success: "text-success-600 bg-success-100",
    warning: "text-warning-600 bg-warning-100",
    danger: "text-danger-600 bg-danger-100",
    gray: "text-gray-600 bg-gray-100",
  };

  const trendColors = {
    up: "text-success-600",
    down: "text-danger-600",
    neutral: "text-gray-500",
  };

  return (
    <Card className={cn("relative overflow-hidden", className)} {...props}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <CardContent className="pb-0">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {trend && trendValue && (
              <div className={cn("flex items-center text-sm font-medium", trendColors[trend])}>
                {trend === 'up' && (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trendValue}
              </div>
            )}
          </div>
          
          {icon && (
            <div className={cn("p-3 rounded-lg", colorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Feature Card Component
const FeatureCard = ({
  title,
  description,
  icon,
  action,
  className,
  ...props
}) => (
  <Card 
    className={cn("group text-center hover:shadow-lg transition-all duration-300", className)}
    hover="lift"
    {...props}
  >
    <CardContent className="space-y-4">
      {icon && (
        <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </CardContent>
  </Card>
);

// Certificate Card Component
const CertificateCard = ({
  certificate,
  onClick,
  onView,
  onEdit,
  onDelete,
  className,
  ...props
}) => {
  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      pending_verification: "bg-warning-100 text-warning-800",
      verified: "bg-success-100 text-success-800",
      issued: "bg-primary-100 text-primary-800",
      revoked: "bg-danger-100 text-danger-800",
    };
    return colors[status] || colors.draft;
  };

  return (
    <Card
      className={cn("group hover:shadow-md transition-all duration-200", className)}
      onClick={onClick}
      {...props}
    >
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {certificate.title}
            </h3>
            <p className="text-sm text-gray-500">ID: {certificate.id}</p>
          </div>
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(certificate.status))}>
            {certificate.status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Recipient:</span>
            <span className="text-gray-900">{certificate.recipientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Course:</span>
            <span className="text-gray-900">{certificate.courseName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span className="text-gray-900">
              {new Date(certificate.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(onView || onEdit || onDelete) && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(certificate);
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(certificate);
                }}
                className="text-xs text-gray-600 hover:text-gray-700 font-medium"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(certificate);
                }}
                className="text-xs text-danger-600 hover:text-danger-700 font-medium ml-auto"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard,
  FeatureCard,
  CertificateCard,
  cardVariants
};