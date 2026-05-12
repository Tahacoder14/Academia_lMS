"use client";
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to external service in production (e.g., Sentry)
    console.error('Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="max-w-md w-full mx-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-rose-500" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-xl font-bold text-slate-950 dark:text-white mb-2">
              Oops, something went wrong
            </h1>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
              We've encountered an unexpected issue. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            <button
              onClick={this.handleReset}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-300" />
              Refresh Page
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full mt-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
