import Link from 'next/link';

interface UseCase {
  title: string;
  why: string;
  linkHref: string;
  linkText?: string;
}

interface UseCaseCardsProps {
  useCases: UseCase[];
}

export default function UseCaseCards({ useCases }: UseCaseCardsProps) {
  if (!useCases || useCases.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Use Cases</h2>
      <div className="space-y-4">
        {useCases.map((useCase, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-indigo-600 font-bold shrink-0 mt-1.5 text-base">•</span>
            <div>
              <p className="text-gray-700 text-base leading-[1.65]">
                <strong className="font-semibold">{useCase.title}:</strong> {useCase.why}
              </p>
              <Link
                href={useCase.linkHref}
                className="text-base text-indigo-600 hover:text-indigo-700 mt-2 inline-block font-medium"
              >
                {useCase.linkText || 'Learn more →'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
