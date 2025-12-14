import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Best AI Video Tools',
  description: 'Privacy Policy for Best AI Video Tools. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Back to Home
          </Link>
        </nav>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: December 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Best AI Video Tools ("we," "our," or "us"). We are committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit 
              our website best-ai-video.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect information about you in various ways:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Automatically Collected Data:</strong> When you visit our site, we automatically collect certain information about your device, including your IP address, browser type, operating system, and browsing behavior.</li>
              <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information.</li>
              <li><strong>Third-Party Services:</strong> We use Google Analytics and other analytics services that may collect information about your use of our website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our website</li>
              <li>Analyze how users interact with our content</li>
              <li>Personalize your experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Affiliate Links and Commissions</h2>
            <p className="text-gray-700 leading-relaxed">
              Our website contains affiliate links to third-party products and services. When you click on these links 
              and make a purchase, we may receive a commission at no additional cost to you. We only recommend products 
              we believe provide value to our users. These affiliate relationships do not influence our editorial content 
              or reviews.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may contain links to third-party websites, services, or applications. We are not responsible 
              for the privacy practices of these third parties. We encourage you to read the privacy policies of any 
              third-party service you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to access your personal data</li>
              <li>Right to rectify inaccurate data</li>
              <li>Right to request deletion of your data</li>
              <li>Right to object to processing of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
              new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

