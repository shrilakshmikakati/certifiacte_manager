import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Button variants using class-variance-authority for type-safe styling
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-700/25 border border-primary-600 hover:border-primary-700",
        destructive: "bg-danger-600 text-white shadow-lg shadow-danger-600/25 hover:bg-danger-700 hover:shadow-danger-700/25 border border-danger-600 hover:border-danger-700",
        success: "bg-success-600 text-white shadow-lg shadow-success-600/25 hover:bg-success-700 hover:shadow-success-700/25 border border-success-600 hover:border-success-700",
        warning: "bg-warning-500 text-white shadow-lg shadow-warning-500/25 hover:bg-warning-600 hover:shadow-warning-600/25 border border-warning-500 hover:border-warning-600",
        outline: "border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:border-gray-400 hover:shadow-md",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 border border-gray-200 hover:border-gray-300",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
        gradient: "bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-600/25 hover:from-primary-700 hover:to-purple-700 border-0",
        glassmorphism: "bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const Comp = asChild ? "span" : "button";
  
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2 flex items-center">
          {leftIcon}
        </span>
      )}
      
      {children}
      
      {!loading && rightIcon && (
        <span className="ml-2 flex items-center">
          {rightIcon}
        </span>
      )}
    </Comp>
  );
});

Button.displayName = "Button";

// Icon Button Component
const IconButton = React.forwardRef(({
  icon,
  className,
  variant = "ghost",
  size = "icon",
  tooltip,
  ...props
}, ref) => {
  const button = (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      {...props}
    >
      {icon}
    </Button>
  );

  if (tooltip) {
    return (
      <div className="group relative">
        {button}
        <div className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {tooltip}
        </div>
      </div>
    );
  }

  return button;
});

IconButton.displayName = "IconButton";

// Button Group Component
const ButtonGroup = ({ children, className, orientation = "horizontal", ...props }) => {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        "[&>*:not(:first-child)]:border-l-0 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none",
        orientation === "vertical" && "[&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-t-0 [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = "ButtonGroup";

export { Button, IconButton, ButtonGroup, buttonVariants };