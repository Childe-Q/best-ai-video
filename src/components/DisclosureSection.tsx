interface DisclosureSectionProps {
  title?: string;
  lines?: string[];
}

const defaultLines = [
  'We may receive commissions through referral links on this page. This helps us maintain and improve our service at no additional cost to you.',
  'Prices are subject to change. Please check the official pricing page for the most up-to-date information.',
];

export default function DisclosureSection({
  title = 'Disclosure',
  lines = defaultLines,
}: DisclosureSectionProps) {
  return (
    <section id="disclosure" className="mt-16 mb-8 max-w-4xl mx-auto">
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
        <div className="text-sm text-gray-700 space-y-2">
          {lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
