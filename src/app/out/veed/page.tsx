import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Veed.io 50% Off Deal | Best AI Video Tools',
  description: 'Redirecting to the official Veed.io deal via Best AI Video Tools.',
  alternates: {
    canonical: '/out/veed',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function VeedBridgePage() {
  const targetUrl = process.env.VEED_OUT_URL;

  if (targetUrl) {
    redirect(targetUrl);
  }

  console.warn('[out/veed] Missing VEED_OUT_URL; rendering fallback page.');

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Link temporarily unavailable</h1>
        <p className="text-gray-600 mb-6">
          The redirect link is not configured right now. Please check back later.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          Return to homepage
        </a>
      </div>
    </div>
  );
}
