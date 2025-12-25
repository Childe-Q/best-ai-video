'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function VeedBridgePage() {
  // Track page view for analytics (optional)
  useEffect(() => {
    // You can add analytics tracking here if needed
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          You are leaving Best AI Video Tools...
        </h1>

        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-gray-700 mb-8 font-semibold">
          We have secured an exclusive <span className="text-indigo-600 font-bold">50% OFF</span> deal for you at Veed.io.
        </p>

        {/* Main CTA Button */}
        <div className="mb-6">
          <a
            href="https://veed.cello.so/oWfwy8CyrIS"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-block w-full md:w-auto px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl md:text-2xl font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 hover:from-indigo-700 hover:to-purple-700"
          >
            Continue to Veed & Claim Discount
          </a>
        </div>

        {/* Safety Text */}
        <p className="text-sm text-gray-500 mt-6">
          You will be redirected to the official Veed.io website securely.
        </p>

        {/* Additional Trust Elements */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Secure Connection</span>
            <span className="mx-2">•</span>
            <span>Official Partner</span>
            <span className="mx-2">•</span>
            <span>Verified Deal</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Best AI Video Tools
          </Link>
        </div>
      </div>
    </div>
  );
}

