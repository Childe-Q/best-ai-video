import Link from 'next/link';
import { Metadata } from 'next';
import { categories } from '@/data/categories';
import { getSEOCurrentYear } from '@/lib/utils';

const seoYear = getSEOCurrentYear();
const hubGuide = [
  {
    title: 'Start from the job to be done',
    description: 'Pick the category that matches the kind of video you need to publish, not the brand you already know. This hub is most useful when your workflow is still being defined.',
  },
  {
    title: 'Shortlist by format, then check tool pages',
    description: 'Once a category narrows the field, move into the tool review pages to see who each product is actually best for, where it breaks, and which comparison pages to open next.',
  },
  {
    title: 'Use VS pages only after the field is small',
    description: 'The comparison pages are strongest when you are deciding between two credible finalists. Use this hub first to avoid comparing the wrong pair.',
  },
];
const bestPicksByUseCase = [
  {
    label: 'Avatar-led sales or training',
    tool: 'HeyGen',
    reason: 'Best when the message depends on a repeatable presenter, not just scenes and captions.',
    href: '/features/ai-avatar-video-generators',
  },
  {
    label: 'High-volume faceless publishing',
    tool: 'InVideo',
    reason: 'Best when you need stock-first drafts for Shorts, explainers, and marketing output at speed.',
    href: '/features/ai-video-for-social-media',
  },
  {
    label: 'Blog or script to video',
    tool: 'Fliki',
    reason: 'Best when the workflow begins with text and speed matters more than having a digital host on screen.',
    href: '/features/text-to-video-ai-tools',
  },
];
const featureTextLinks = [
  {
    href: '/features/ai-avatar-video-generators',
    title: 'Need a spokesperson on screen?',
    description: 'Start with the avatar hub if the buyer expects a presenter-led video rather than a stock-footage montage.',
  },
  {
    href: '/features/content-repurposing-ai-tools',
    title: 'Turning existing content into video?',
    description: 'Go here if your raw material is a webinar, article, podcast, or transcript that needs to become short-form output.',
  },
  {
    href: '/features/enterprise-ai-video-solutions',
    title: 'Buying for a team, not a solo creator?',
    description: 'Use the enterprise route when approvals, governance, translation workflow, or procurement posture matter as much as the editor itself.',
  },
];

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
        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">How to use this hub</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">Treat this page as a routing layer, not a giant list</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {hubGuide.map((item) => (
              <article key={item.title} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Best picks by use case</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">Three fast starting points if you do not want to scan every category</h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {bestPicksByUseCase.map((pick) => (
              <Link
                key={pick.label}
                href={pick.href}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5 transition-all duration-200 hover:border-indigo-300 hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{pick.label}</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{pick.tool}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{pick.reason}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Where to go next</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">Text-first entrances into the strongest sub-hubs</h2>
          </div>
          <div className="mt-6 space-y-4">
            {featureTextLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl border border-gray-200 bg-gray-50 p-5 transition-all duration-200 hover:border-indigo-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

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
