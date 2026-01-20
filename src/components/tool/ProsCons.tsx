import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';

interface ProsConsProps {
  pros: string[];
  cons: string[];
}

export default function ProsCons({ pros, cons }: ProsConsProps) {
  if ((!pros || pros.length === 0) && (!cons || cons.length === 0)) return null;

  return (
    <div id="pros-cons" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pros Column */}
      {pros && pros.length > 0 && (
        <div className="bg-green-50/50 rounded-xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200">
          <h3 className="text-xl font-bold text-green-700 mb-5 flex items-center gap-2">
            <HandThumbUpIcon className="w-6 h-6" />
            Pros
          </h3>
          <ul className="space-y-3">
            {pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700 text-base leading-[1.65]">
                <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span> 
                <span className="font-semibold">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Cons Column */}
      {cons && cons.length > 0 && (
        <div className="bg-red-50/50 rounded-xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200">
          <h3 className="text-xl font-bold text-red-700 mb-5 flex items-center gap-2">
            <HandThumbDownIcon className="w-6 h-6" />
            Cons
          </h3>
          <ul className="space-y-3">
            {cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700 text-base leading-[1.65]">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span> 
                <span className="font-semibold">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
