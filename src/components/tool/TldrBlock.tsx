interface TldrBlockProps {
  bestFor: string;
  notFor: string;
  why: string;
}

export default function TldrBlock({ bestFor, notFor, why }: TldrBlockProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">TL;DR</h2>
      <div className="space-y-4 text-gray-700">
        <p className="text-base leading-[1.65]">
          <strong className="font-semibold">Best for:</strong> {bestFor}
        </p>
        <p className="text-base leading-[1.65]">
          <strong className="font-semibold">Not ideal for:</strong> {notFor}
        </p>
        <p className="text-base leading-[1.65]">
          <strong className="font-semibold">Why we recommend it:</strong> {why}
        </p>
      </div>
    </div>
  );
}
