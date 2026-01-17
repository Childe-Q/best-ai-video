import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const siteName = 'Best AI Video Tools';

  return (
    <footer className="bg-[#111111] text-white border-t-2 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white font-black text-xl mb-4 uppercase tracking-tight">{siteName}</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed max-w-md font-medium">
              Your trusted source for AI video tool reviews, comparisons, and recommendations. 
              We help you find the perfect video creation software for your needs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#F6D200] font-bold text-sm mb-4 uppercase tracking-wider border-b-2 border-[#F6D200] inline-block pb-1">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm !text-[#E5E5E5] hover:!text-[#F6D200] transition-colors !no-underline font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm !text-[#E5E5E5] hover:!text-[#F6D200] transition-colors !no-underline font-medium">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#F6D200] font-bold text-sm mb-4 uppercase tracking-wider border-b-2 border-[#F6D200] inline-block pb-1">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm !text-[#E5E5E5] hover:!text-[#F6D200] transition-colors !no-underline font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm !text-[#E5E5E5] hover:!text-[#F6D200] transition-colors !no-underline font-medium">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#999999]">
            © {currentYear} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-[#999999]">
            Disclosure: Some links are affiliate links. We may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
