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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Use Cases</h2>
      <div className="space-y-4">
        {useCases.map((useCase, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-indigo-600 font-bold shrink-0 mt-1">•</span>
            <div>
              <p className="text-gray-700 leading-relaxed">
                <strong>{useCase.title}:</strong> {useCase.why}
              </p>
              <Link
                href={useCase.linkHref}
                className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
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
