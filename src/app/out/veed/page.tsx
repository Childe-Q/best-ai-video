'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function VeedBridgePage() {
  const [copied, setCopied] = useState(false);
  const veedAffiliateLink = 'https://veed.cello.so/oWfwy8CyrIS';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(veedAffiliateLink);
      setCopied(true);
      // Reset after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = veedAffiliateLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

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

        {/* Manual Claim Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 md:p-8 border-2 border-indigo-200">
            <p className="text-base md:text-lg text-gray-700 mb-6 font-medium">
              To activate your <span className="text-indigo-600 font-bold">50% OFF discount</span>, please copy the secure link below and paste it into a new tab.
            </p>

            {/* Input Field with Copy Button */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                readOnly
                value={veedAffiliateLink}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm md:text-base text-gray-700 font-mono focus:outline-none focus:border-indigo-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className={`px-6 py-3 rounded-lg font-semibold text-base md:text-lg transition-all duration-200 ${
                  copied
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                }`}
              >
                {copied ? 'Copied! ✅' : 'Copy Link'}
              </button>
            </div>

            {/* Secondary Direct Click Button */}
            <a
              href={veedAffiliateLink}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="inline-block w-full sm:w-auto px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-200"
            >
              Open Veed.io (Try Direct Click)
            </a>
          </div>
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

