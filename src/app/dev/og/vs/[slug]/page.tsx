import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVsOgData } from '@/lib/og/getVsOgData';

const VARIANTS = [
  {
    id: 'default',
    name: 'Current Default',
    title: 'Current Production Layout',
    note: 'The existing centered card that still powers the default OG route.',
  },
  {
    id: 'hero',
    name: 'Version A',
    title: 'Hero Comparison Card',
    note: 'A stronger hero-style intro block with chips treated as supporting info.',
  },
  {
    id: 'header',
    name: 'Version B',
    title: 'Comparison Header Snapshot',
    note: 'A top-heavy comparison header with a structured row underneath.',
  },
] as const;

export default async function VsOgPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getVsOgData(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#faf7f0] px-5 py-10 text-gray-900 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-6 py-6 shadow-sm backdrop-blur md:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">VS OG Preview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {data.toolAName} vs {data.toolBName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
            The production OG image still comes from `/vs/{slug}/opengraph-image`. This page exists to compare the current default layout against the two stronger replacement directions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/vs/${slug}/opengraph-image`}
              className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 font-semibold text-gray-800 hover:bg-black/[0.03]"
            >
              Open production default
            </Link>
            {VARIANTS.map((variant) => (
              <Link
                key={variant.id}
                href={`/dev/og/vs/${slug}/image?variant=${variant.id}`}
                className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-black/[0.03]"
              >
                Open {variant.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {VARIANTS.map((variant) => (
            <section
              key={variant.id}
              className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm md:p-6"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {variant.name}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-gray-950">{variant.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{variant.note}</p>
                </div>
                <code className="rounded-full border border-black/10 bg-[#faf7f0] px-3 py-1.5 text-xs text-gray-600">
                  /dev/og/vs/{slug}/image?variant={variant.id}
                </code>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-[#faf7f0]">
                <Image
                  src={`/dev/og/vs/${slug}/image?variant=${variant.id}`}
                  alt={`${variant.title} preview`}
                  width={1200}
                  height={630}
                  className="block h-auto w-full"
                  unoptimized
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
