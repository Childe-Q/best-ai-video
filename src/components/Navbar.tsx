import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Name */}
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            AI Video Tools
          </Link>
          
          {/* Right side - All Tools button */}
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            All Tools
          </Link>
        </div>
      </div>
    </nav>
  );
}

