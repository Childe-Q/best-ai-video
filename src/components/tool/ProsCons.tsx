import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';

interface ProsConsProps {
  pros: string[];
  cons: string[];
}

export default function ProsCons({ pros, cons }: ProsConsProps) {
  if ((!pros || pros.length === 0) && (!cons || cons.length === 0)) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pros Column */}
      {pros && pros.length > 0 && (
        <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
          <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
            <HandThumbUpIcon className="w-5 h-5" />
            Pros
          </h3>
          <ul className="space-y-3">
            {pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                <span className="text-green-500 font-bold shrink-0">✓</span> {pro}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Cons Column */}
      {cons && cons.length > 0 && (
        <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
          <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
            <HandThumbDownIcon className="w-5 h-5" />
            Cons
          </h3>
          <ul className="space-y-3">
            {cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm">
                <span className="text-red-500 font-bold shrink-0">✕</span> {con}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
