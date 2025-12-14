import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Best AI Video Tools',
  description: 'Learn about Best AI Video Tools. We provide independent reviews and comparisons of AI video creation software.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Back to Home
          </Link>
        </nav>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About Us</h1>
        <p className="text-xl text-gray-600 mb-8">Your trusted source for AI video tool reviews and recommendations.</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              At Best AI Video Tools, we're dedicated to helping content creators, marketers, and businesses find the 
              perfect AI video creation software for their needs. We understand that choosing the right tool can be 
              overwhelming with so many options available, which is why we provide comprehensive, unbiased reviews 
              and detailed comparisons.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Do</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We offer:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>In-Depth Reviews:</strong> Detailed analysis of each AI video tool, including features, pricing, pros, and cons</li>
              <li><strong>Side-by-Side Comparisons:</strong> Easy-to-read comparison tables to help you make informed decisions</li>
              <li><strong>Pricing Guides:</strong> Transparent pricing information and free plan availability</li>
              <li><strong>Alternative Recommendations:</strong> Discover similar tools that might better fit your specific needs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Review Process</h2>
            <p className="text-gray-700 leading-relaxed">
              We thoroughly test and research each tool we review. Our team evaluates factors such as ease of use, 
              feature set, pricing, customer support, and real-world performance. We also consider user feedback and 
              industry trends to ensure our reviews remain current and relevant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transparency and Independence</h2>
            <p className="text-gray-700 leading-relaxed">
              While we may earn commissions when you make purchases through our affiliate links, this does not influence 
              our editorial content or recommendations. Our reviews are based on our independent research and analysis. 
              We only recommend products we genuinely believe provide value to our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated</h2>
            <p className="text-gray-700 leading-relaxed">
              The AI video tool landscape is constantly evolving. We regularly update our reviews and add new tools to 
              our directory to ensure you have access to the most current information. Check back often for the latest 
              reviews and recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              Have a question or suggestion? We'd love to hear from you. Please reach out through our website, and 
              we'll get back to you as soon as possible.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

