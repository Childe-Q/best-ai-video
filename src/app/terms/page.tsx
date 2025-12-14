import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Best AI Video Tools',
  description: 'Terms of Service for Best AI Video Tools. Read our terms and conditions for using our website.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Back to Home
          </Link>
        </nav>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: December 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using best-ai-video.com (the "Website"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Permission is granted to temporarily access the materials on Best AI Video Tools' website for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under 
              this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials on Best AI Video Tools' website are provided on an 'as is' basis. Best AI Video Tools makes 
              no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, 
              without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, 
              or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall Best AI Video Tools or its suppliers be liable for any damages (including, without 
              limitation, damages for loss of data or profit, or due to business interruption) arising out of the use 
              or inability to use the materials on Best AI Video Tools' website, even if Best AI Video Tools or a 
              Best AI Video Tools authorized representative has been notified orally or in writing of the possibility 
              of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials appearing on Best AI Video Tools' website could include technical, typographical, or 
              photographic errors. Best AI Video Tools does not warrant that any of the materials on its website are 
              accurate, complete, or current. Best AI Video Tools may make changes to the materials contained on its 
              website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Affiliate Disclosure</h2>
            <p className="text-gray-700 leading-relaxed">
              Best AI Video Tools participates in various affiliate marketing programs, which means we may get paid 
              commissions on purchases made through our links to retailer sites. This does not affect the price you 
              pay for products or services. Our reviews and recommendations are based on our independent research and 
              analysis, and we only recommend products we believe provide genuine value.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Links to Third-Party Sites</h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may contain links to third-party websites or services that are not owned or controlled by 
              Best AI Video Tools. We have no control over, and assume no responsibility for, the content, privacy 
              policies, or practices of any third-party websites or services. You acknowledge and agree that Best AI 
              Video Tools shall not be responsible or liable for any damage or loss caused by or in connection with 
              the use of any such content, goods, or services available on or through any such websites or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Best AI Video Tools may revise these terms of service for its website at any time without notice. By 
              using this website you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes 
              relating to these terms shall be subject to the exclusive jurisdiction of the courts in the applicable 
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

