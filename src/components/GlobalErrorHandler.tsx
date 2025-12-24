'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message || '';
      const errorString = String(error);
      const errorName = error?.name || '';
      const errorMessage = error?.message || '';
      const filename = event.filename || '';
      const target = event.target as HTMLElement;
      
      // Check if error is from image loading failure
      const isImageLoadError = 
        (target?.tagName === 'IMG' || target?.tagName === 'img') ||
        errorMessage?.toLowerCase().includes('load failed') ||
        errorMessage?.toLowerCase().includes('failed to load') ||
        errorString?.toLowerCase().includes('load failed');
      
      // Check if error is from browser extension (obfuscated code)
      const isExtensionError = 
        errorString.includes('_0x') ||
        errorString.includes('webkit-masked-url') ||
        filename.includes('webkit-masked-url') ||
        filename.includes('chrome-extension://') ||
        filename.includes('moz-extension://') ||
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        (errorString.includes('Can\'t find variable') && errorString.includes('_0x')) ||
        // Handle NotAllowedError from browser extensions trying to autoplay
        (errorName === 'NotAllowedError' && filename.includes('webkit-masked-url')) ||
        (errorName === 'NotAllowedError' && (filename.includes('chrome-extension://') || filename.includes('moz-extension://'))) ||
        // Handle play() errors from extensions
        (errorMessage.includes('play') && filename.includes('webkit-masked-url'));
      
      // Silently ignore image load errors (they're handled by onError handlers)
      if (isImageLoadError) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('Ignored image load error:', errorMessage || errorString);
        return false;
      }
      
      // Silently ignore extension errors
      if (isExtensionError) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('Ignored browser extension error:', errorName || errorString);
        return false;
      }
      
      // Allow real errors to be logged normally
      return true;
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason || '';
      const errorString = String(error);
      const errorName = error?.name || '';
      const errorMessage = error?.message || '';
      
      // Check if error is from browser extension
      const isExtensionError = 
        errorString.includes('_0x') ||
        errorString.includes('webkit-masked-url') ||
        errorString.includes('chrome-extension://') ||
        errorString.includes('moz-extension://') ||
        (errorString.includes('Can\'t find variable') && errorString.includes('_0x')) ||
        // Handle NotAllowedError from browser extensions trying to autoplay
        (errorName === 'NotAllowedError' && errorString.includes('webkit-masked-url')) ||
        (errorName === 'NotAllowedError' && (errorString.includes('chrome-extension://') || errorString.includes('moz-extension://'))) ||
        // Handle play() errors from extensions
        (errorMessage.includes('play') && errorString.includes('webkit-masked-url'));
      
      // Silently ignore extension errors
      if (isExtensionError) {
        event.preventDefault();
        console.debug('Ignored browser extension promise rejection:', errorName || errorString);
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

