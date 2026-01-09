import Link from 'next/link';
import { Metadata } from 'next';
import { categories } from '@/data/categories';
import { getSEOCurrentYear } from '@/lib/utils';

const seoYear = getSEOCurrentYear();

export function generateMetadata(): Metadata {
  return {
    title: `Explore AI Video Tools by Use Case ${seoYear}`,
    description: `Discover AI video tools organized by use case. Find the perfect tool for text-to-video, avatars, editing, social media, and more.`,
  };
}

export default function FeaturesHubPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Explore AI Video Tools by Use Case
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Find the perfect AI video tool for your specific needs. Browse by category to discover tools optimized for your use case.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/features/${category.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-300 group"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {category.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {category.description}
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                Explore Tools
                <span className="ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
