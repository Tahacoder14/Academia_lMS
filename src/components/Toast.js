"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
          border: 'border-emerald-200 dark:border-emerald-500/20',
          icon: 'text-emerald-600 dark:text-emerald-400',
          text: 'text-emerald-900 dark:text-emerald-100'
        };
      case 'error':
        return {
          bg: 'bg-rose-50 dark:bg-rose-500/10',
          border: 'border-rose-200 dark:border-rose-500/20',
          icon: 'text-rose-600 dark:text-rose-400',
          text: 'text-rose-900 dark:text-rose-100'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-500/10',
          border: 'border-amber-200 dark:border-amber-500/20',
          icon: 'text-amber-600 dark:text-amber-400',
          text: 'text-amber-900 dark:text-amber-100'
        };
      default:
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          border: 'border-indigo-200 dark:border-indigo-500/20',
          icon: 'text-indigo-600 dark:text-indigo-400',
          text: 'text-indigo-900 dark:text-indigo-100'
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-xl shadow-lg p-4 flex items-start gap-3 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300`}
    >
      <div className={colors.icon}>
        {getIcon()}
      </div>
      <p className={`${colors.text} text-sm font-medium flex-1`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        className={`${colors.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default { ToastProvider, useToast };
