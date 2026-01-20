import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { categories } from '@/data/categories';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';
import HomeToolGrid from '@/components/HomeToolGrid';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getSEOCurrentYear } from '@/lib/utils';

const tools: Tool[] = toolsData as Tool[];
const seoYear = getSEOCurrentYear();

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((cat) => cat.slug === slug);
  
  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.title} | Best AI Video Tools`,
    description: category.metaDescription || category.description,
  };
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function FeatureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categories.find((cat) => cat.slug === slug);

  if (!category) {
    notFound();
  }

  // Filter tools that include the matching tag
  const filteredTools = tools.filter((tool) =>
    tool.tags?.includes(category.tag)
  );

  // Get 4 random other categories (excluding current)
  const otherCategories = shuffleArray(
    categories.filter((cat) => cat.slug !== slug)
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
            <li className="flex items-center">
              <Link
                href="/"
                className="hover:text-gray-900 hover:opacity-80 transition-colors"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-1.5">→</span>
              <Link
                href="/features"
                className="hover:text-gray-900 hover:opacity-80 transition-colors"
              >
                Features
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-1.5">→</span>
              <span className="text-gray-900 font-medium">{category.title}</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {category.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            {category.description}
          </p>
          {filteredTools.length > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              Found {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} matching this category
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredTools.length > 0 ? (
          <>
            {/* Tools Grid */}
            <div className="mb-16">
              <HomeToolGrid tools={filteredTools} />
            </div>

            {/* Explore More Section */}
            {otherCategories.length > 0 && (
              <section className="mt-16 pt-12 border-t border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  Explore More Categories
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {otherCategories.map((otherCategory) => (
                    <Link
                      key={otherCategory.slug}
                      href={`/features/${otherCategory.slug}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-indigo-300 transition-all duration-300 group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {otherCategory.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {otherCategory.description}
                      </p>
                      <div className="mt-3 flex items-center text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                        View
                        <span className="ml-1">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Tools Found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any tools matching this category. Please check back later or explore other categories.
            </p>
            <Link
              href="/features"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse All Categories
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
