import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const siteName = 'Best AI Video Tools';

  return (
    <footer className="bg-[#FAF7F2] border-t border-black/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-black font-bold text-xl mb-4">{siteName}</h3>
            <p className="text-sm text-black/70 leading-relaxed max-w-md">
              Your trusted source for AI video tool reviews, comparisons, and recommendations. 
              We help you find the perfect video creation software for your needs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-black font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-black/70 hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-black/70 hover:text-black transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-black font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-black/70 hover:text-black transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-black/70 hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-black/60">
            © {currentYear} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-black/40">
            Disclosure: Some links are affiliate links. We may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
