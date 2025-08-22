import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [message.duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(message.id), 300);
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (message.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>{message.title}</p>
          {message.description && (
            <p className={`mt-1 text-sm ${getTextColor()}`}>{message.description}</p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleClose}
            className={`inline-flex ${getTextColor()} hover:opacity-75 focus:outline-none`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...message, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  };

  const showError = (title: string, description?: string) => {
    addToast({ type: 'error', title, description, duration: 7000 });
  };

  const showWarning = (title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  };

  const showInfo = (title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
