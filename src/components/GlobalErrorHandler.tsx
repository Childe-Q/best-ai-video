'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    const isMaskedInjectedSource = (value: string) =>
      value.includes('webkit-masked-url') ||
      value.includes('safari-web-extension://') ||
      value.includes('chrome-extension://') ||
      value.includes('moz-extension://') ||
      value.includes('hidden/:');

    const isMaskedInjectedPostMessageError = (message: string, source: string) =>
      (message.toLowerCase().includes('postmessage') ||
        message.toLowerCase().includes('.postmessage') ||
        (message.toLowerCase().includes('null is not an object') &&
          message.toLowerCase().includes('postmessage'))) &&
      (isMaskedInjectedSource(message) || isMaskedInjectedSource(source));

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message || '';
      const errorString = String(error);
      const errorName = error?.name || '';
      const errorMessage = error?.message || '';
      
      // Ignore Next.js internal errors
      if (error?.digest === 'NEXT_REDIRECT' || error?.digest === 'NEXT_NOT_FOUND') {
        return false;
      }

      const filename = event.filename || '';
      const target = event.target as HTMLElement;
      const maskedPostMessageError = isMaskedInjectedPostMessageError(errorMessage || errorString, `${filename} ${errorString}`);
      
      // Check if error is from image loading failure
      const isImageLoadError = 
        (target?.tagName === 'IMG' || target?.tagName === 'img') ||
        errorMessage?.toLowerCase().includes('load failed') ||
        errorMessage?.toLowerCase().includes('failed to load') ||
        errorString?.toLowerCase().includes('load failed');
      
      // Check if error is from browser extension (obfuscated code)
      const isExtensionError = 
        errorString.includes('_0x') ||
        isMaskedInjectedSource(errorString) ||
        isMaskedInjectedSource(filename) ||
        maskedPostMessageError ||
        (errorString.includes('Can\'t find variable') && errorString.includes('_0x')) ||
        // Handle NotAllowedError from browser extensions trying to autoplay
        (errorName === 'NotAllowedError' && filename.includes('webkit-masked-url')) ||
        (errorName === 'NotAllowedError' && (filename.includes('chrome-extension://') || filename.includes('moz-extension://') || filename.includes('safari-web-extension://'))) ||
        // Handle play() errors from extensions
        (errorMessage.includes('play') && filename.includes('webkit-masked-url')) ||
        // Handle CSP errors from extensions
        errorString.includes('Content-Security-Policy') ||
        errorString.includes('require-trusted-types-for') ||
        errorMessage.includes('Content-Security-Policy') ||
        errorMessage.includes('require-trusted-types-for') ||
        // Handle network errors from extensions
        (errorMessage.includes('network connection was lost') && filename.includes('extension'));
      
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
      
      // Ignore Next.js internal errors
      if (
        error?.digest === 'NEXT_REDIRECT' || 
        error?.digest === 'NEXT_NOT_FOUND' ||
        String(error).includes('NEXT_REDIRECT')
      ) {
        event.preventDefault();
        return false;
      }

      const errorString = String(error);
      const errorName = error?.name || '';
      const errorMessage = error?.message || '';
      const maskedPostMessageError = isMaskedInjectedPostMessageError(errorMessage || errorString, errorString);
      
      // Check if error is from browser extension
      const isExtensionError = 
        errorString.includes('_0x') ||
        isMaskedInjectedSource(errorString) ||
        maskedPostMessageError ||
        (errorString.includes('Can\'t find variable') && errorString.includes('_0x')) ||
        // Handle NotAllowedError from browser extensions trying to autoplay
        (errorName === 'NotAllowedError' && errorString.includes('webkit-masked-url')) ||
        (errorName === 'NotAllowedError' && (errorString.includes('chrome-extension://') || errorString.includes('moz-extension://') || errorString.includes('safari-web-extension://'))) ||
        // Handle play() errors from extensions
        (errorMessage.includes('play') && errorString.includes('webkit-masked-url')) ||
        // Handle CSP errors from extensions
        errorString.includes('Content-Security-Policy') ||
        errorString.includes('require-trusted-types-for') ||
        errorMessage.includes('Content-Security-Policy') ||
        errorMessage.includes('require-trusted-types-for') ||
        // Handle network errors from extensions
        (errorMessage.includes('network connection was lost') && errorString.includes('extension'));
      
      // Silently ignore extension errors
      if (isExtensionError) {
        event.preventDefault();
        console.debug('Ignored browser extension promise rejection:', errorName || errorString);
        return false;
      }
      
      // Allow real errors to be logged normally
      return true;
    };

    // Intercept console errors to filter extension-related messages
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args
        .map((arg) => {
          if (typeof arg === 'string') return arg;
          if (arg instanceof Error) return `${arg.name} ${arg.message} ${arg.stack || ''}`;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(' ');
      const normalizedMessage = message.toLowerCase();
      // Filter out extension-related console errors
      if (
        isMaskedInjectedPostMessageError(normalizedMessage, message) ||
        isMaskedInjectedSource(message) ||
        message.includes('Content-Security-Policy') ||
        message.includes('require-trusted-types-for') ||
        message.includes('script-src directive') ||
        message.includes('Refused to load') ||
        (normalizedMessage.includes('null is not an object') && normalizedMessage.includes('postmessage')) ||
        (message.includes('network connection was lost') && (message.includes('extension') || message.includes('allowlist') || message.includes('GenerateIT')))
      ) {
        // Silently ignore extension-related console errors
        return;
      }
      // Call original console.error for real errors
      originalConsoleError.apply(console, args);
    };

    // Add event listeners
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
