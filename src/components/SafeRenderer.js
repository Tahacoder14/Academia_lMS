"use client";
import React from 'react';
import { AlertCircle } from 'lucide-react';

export function SafeComponentRenderer({ component, fallback = null, ...props }) {
  try {
    if (!component) return fallback;
    if (typeof component === 'function') return component(props);
    return component;
  } catch (error) {
    console.error('Error rendering component:', error);
    return fallback;
  }
}

export function SafeIcon({ Icon, size = 18, fallbackIcon: FallbackIcon = AlertCircle, ...props }) {
  try {
    if (!Icon || typeof Icon !== 'function') {
      return <FallbackIcon size={size} {...props} />;
    }
    return <Icon size={size} {...props} />;
  } catch (error) {
    console.error('Error rendering icon:', error);
    return <FallbackIcon size={size} {...props} />;
  }
}

export function ErrorFallback() {
  return (
    <div className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg">
      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Item unavailable</p>
    </div>
  );
}

export default { SafeComponentRenderer, SafeIcon, ErrorFallback };
