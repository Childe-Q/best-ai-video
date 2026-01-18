import CTAButton from '@/components/CTAButton';

interface VerdictSectionProps {
  title: string;
  text: string;
  affiliateLink: string;
  hasFreeTrial: boolean;
}

export default function VerdictSection({
  title,
  text,
  affiliateLink,
  hasFreeTrial,
}: VerdictSectionProps) {
  return (
    <section className="bg-indigo-50 rounded-2xl p-8 border-2 border-indigo-100 text-center max-w-4xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
        {title}
      </h2>
      <p className="text-gray-700 mb-6 leading-relaxed text-base md:text-lg">
        {text}
      </p>
      <CTAButton affiliateLink={affiliateLink} hasFreeTrial={hasFreeTrial} />
    </section>
  );
}
