import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Modal variants
const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center p-4",
  {
    variants: {
      variant: {
        default: "bg-black/50 backdrop-blur-sm",
        dark: "bg-black/70 backdrop-blur-md",
        light: "bg-white/30 backdrop-blur-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const modalContentVariants = cva(
  "relative w-full max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl transform transition-all duration-300 ease-out",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        "2xl": "max-w-6xl",
        full: "max-w-[95vw]",
      },
      animation: {
        scale: "scale-100 opacity-100",
        slideUp: "translate-y-0 opacity-100",
        slideDown: "translate-y-0 opacity-100",
      },
    },
    defaultVariants: {
      size: "md",
      animation: "scale",
    },
  }
);

// Main Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  variant = "default",
  animation = "scale",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  ...props
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getAnimationClasses = (animation, isClosing = false) => {
    const baseClasses = {
      scale: isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100",
      slideUp: isClosing ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
      slideDown: isClosing ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100",
    };
    return baseClasses[animation] || baseClasses.scale;
  };

  return createPortal(
    <div
      className={cn(modalVariants({ variant }), overlayClassName)}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      {...props}
    >
      <div
        className={cn(
          modalContentVariants({ size }),
          getAnimationClasses(animation),
          className
        )}
        role="document"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex-1">
              {title && (
                <h3 id="modal-title" className="text-xl font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Modal Header Component
const ModalHeader = ({ title, description, onClose, className, children }) => (
  <div className={cn("flex items-center justify-between p-6 border-b border-gray-100", className)}>
    <div className="flex-1">
      {title && (
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      )}
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {children}
    </div>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    )}
  </div>
);

// Modal Body Component
const ModalBody = ({ className, children, ...props }) => (
  <div className={cn("p-6 overflow-y-auto", className)} {...props}>
    {children}
  </div>
);

// Modal Footer Component
const ModalFooter = ({ className, children, ...props }) => (
  <div className={cn("flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50", className)} {...props}>
    {children}
  </div>
);

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  ...props
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="sm"
    title={title}
    {...props}
  >
    <div className="space-y-4">
      <p className="text-gray-700">{message}</p>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

// Alert Modal Component
const AlertModal = ({
  isOpen,
  onClose,
  title = "Alert",
  message,
  variant = "default",
  buttonText = "OK",
  ...props
}) => {
  const getIcon = () => {
    const icons = {
      success: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
          <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      ),
      error: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
          <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      warning: (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
          <svg className="h-6 w-6 text-warning-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
      ),
    };
    return icons[variant] || null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      {...props}
    >
      <div className="text-center space-y-4">
        {getIcon()}
        <p className="text-gray-700">{message}</p>
        <Button
          variant={variant === 'error' ? 'danger' : variant}
          onClick={onClose}
          className="w-full"
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
};

// Loading Modal Component
const LoadingModal = ({
  isOpen,
  title = "Loading...",
  message = "Please wait while we process your request.",
  ...props
}) => (
  <Modal
    isOpen={isOpen}
    onClose={() => {}} // Prevent closing during loading
    size="sm"
    closeOnBackdrop={false}
    closeOnEscape={false}
    showCloseButton={false}
    {...props}
  >
    <div className="text-center space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{message}</p>
      </div>
    </div>
  </Modal>
);

// InfoModal component for displaying information
const InfoModal = ({ isOpen, onClose, title, children, ...props }) => (
  <Modal isOpen={isOpen} onClose={onClose} {...props}>
    <ModalHeader onClose={onClose}>
      {title}
    </ModalHeader>
    <ModalBody>
      {children}
    </ModalBody>
  </Modal>
);

export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmationModal,
  AlertModal,
  LoadingModal,
  InfoModal,
  modalVariants,
  modalContentVariants
};