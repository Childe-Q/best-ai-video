'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error & { digest?: string }): ErrorBoundaryState {
    // Check for Next.js redirect/not-found errors - rethrow them to let Next.js handle it
    if (
      error.digest === 'NEXT_REDIRECT' || 
      error.digest === 'NEXT_NOT_FOUND' ||
      error.message === 'NEXT_REDIRECT'
    ) {
      throw error;
    }

    // Check if error is from browser extension (obfuscated code)
    const isExtensionError = 
      error.message?.includes('_0x') ||
      error.stack?.includes('webkit-masked-url') ||
      error.stack?.includes('chrome-extension://') ||
      error.stack?.includes('moz-extension://') ||
      (error.name === 'ReferenceError' && error.message?.includes('Can\'t find variable')) ||
      // Handle NotAllowedError from browser extensions trying to autoplay
      (error.name === 'NotAllowedError' && (error.stack?.includes('webkit-masked-url') || error.stack?.includes('chrome-extension://') || error.stack?.includes('moz-extension://'))) ||
      // Handle play() errors from extensions
      (error.message?.includes('play') && error.stack?.includes('webkit-masked-url'));
    
    // If it's an extension error, don't show error UI
    if (isExtensionError) {
      return { hasError: false, error: null };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error & { digest?: string }, errorInfo: React.ErrorInfo) {
    // Ignore Next.js internal errors
    if (
      error.digest === 'NEXT_REDIRECT' || 
      error.digest === 'NEXT_NOT_FOUND' ||
      error.message === 'NEXT_REDIRECT'
    ) {
      return;
    }

    // Check if error is from browser extension
    const isExtensionError = 
      error.message?.includes('_0x') ||
      error.stack?.includes('webkit-masked-url') ||
      error.stack?.includes('chrome-extension://') ||
      error.stack?.includes('moz-extension://') ||
      (error.name === 'ReferenceError' && error.message?.includes('Can\'t find variable')) ||
      // Handle NotAllowedError from browser extensions trying to autoplay
      (error.name === 'NotAllowedError' && (error.stack?.includes('webkit-masked-url') || error.stack?.includes('chrome-extension://') || error.stack?.includes('moz-extension://'))) ||
      // Handle play() errors from extensions
      (error.message?.includes('play') && error.stack?.includes('webkit-masked-url'));
    
    // Silently ignore extension errors
    if (isExtensionError) {
      console.debug('Ignored browser extension error:', error.name || error.message);
      return;
    }
    
    // Log real errors
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

