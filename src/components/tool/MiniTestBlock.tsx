interface MiniTestBlockProps {
  prompt: string;
  generationTime?: string;
  footageMatch?: string;
  subtitleAccuracy?: string;
  verdict?: string;
  checklist?: Array<{
    label: string;
    value: string;
  }>;
}

export default function MiniTestBlock({
  prompt,
  generationTime,
  footageMatch,
  subtitleAccuracy,
  verdict,
  checklist,
}: MiniTestBlockProps) {
  const hasResults = generationTime && 
    !generationTime.includes('[NEED_TEST') &&
    !footageMatch?.includes('[NEED_TEST');

  const defaultChecklist = [
    { label: 'Generation Time', value: generationTime || 'Not tested yet' },
    { label: 'Footage Match', value: footageMatch || 'Not tested yet' },
    { label: 'Subtitle Accuracy', value: subtitleAccuracy || 'Not tested yet' },
    { label: 'Verdict', value: verdict || 'Pending' },
  ];

  const displayChecklist = checklist || defaultChecklist;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Mini Test</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
        <p className="text-sm font-semibold text-yellow-800 mb-2">
          {hasResults ? 'Test Results' : 'Test pending'}
        </p>
        <p className="text-sm text-gray-700 mb-4">
          <strong>Test prompt:</strong> &quot;{prompt}&quot;
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {displayChecklist.map((item, idx) => (
            <div key={idx} className="text-xs">
              <span className="font-semibold text-gray-600">{item.label}:</span>
              <span className="ml-2 text-gray-500">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
