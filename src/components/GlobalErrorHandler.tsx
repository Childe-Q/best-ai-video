'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message || '';
      const errorString = String(error);
      
      // Check if error is from browser extension (obfuscated code)
      const isExtensionError = 
        errorString.includes('_0x') ||
        errorString.includes('webkit-masked-url') ||
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        (errorString.includes('Can\'t find variable') && errorString.includes('_0x'));
      
      // Silently ignore extension errors
      if (isExtensionError) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('Ignored browser extension error:', errorString);
        return false;
      }
      
      // Allow real errors to be logged normally
      return true;
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason || '';
      const errorString = String(error);
      
      // Check if error is from browser extension
      const isExtensionError = 
        errorString.includes('_0x') ||
        errorString.includes('webkit-masked-url') ||
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        (errorString.includes('Can\'t find variable') && errorString.includes('_0x'));
      
      // Silently ignore extension errors
      if (isExtensionError) {
        event.preventDefault();
        console.debug('Ignored browser extension promise rejection:', errorString);
        return false;
      }
      
      // Allow real errors to be logged normally
      return true;
    };

    // Add event listeners
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

