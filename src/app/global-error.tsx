'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ignore Next.js internal redirect/not-found errors
    if (error.digest === 'NEXT_REDIRECT' || error.digest === 'NEXT_NOT_FOUND') {
      return;
    }
    // Log other errors
    console.error('Global application error:', error);
  }, [error]);

  // Don't render error UI for Next.js internal errors
  if (error.digest === 'NEXT_REDIRECT' || error.digest === 'NEXT_NOT_FOUND') {
    return null;
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
