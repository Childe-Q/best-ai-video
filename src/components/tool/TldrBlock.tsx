interface TldrBlockProps {
  bestFor: string;
  notFor: string;
  why: string;
}

export default function TldrBlock({ bestFor, notFor, why }: TldrBlockProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">TL;DR</h2>
      <div className="space-y-3 text-gray-700">
        <p className="leading-relaxed">
          <strong>Best for:</strong> {bestFor}
        </p>
        <p className="leading-relaxed">
          <strong>Not ideal for:</strong> {notFor}
        </p>
        <p className="leading-relaxed">
          <strong>Why we recommend it:</strong> {why}
        </p>
      </div>
    </div>
  );
}
