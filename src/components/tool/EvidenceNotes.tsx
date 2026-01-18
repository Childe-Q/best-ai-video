interface Source {
  type: string;
  howToVerify: string;
  suggestedQuery?: string;
}

interface EvidenceNotesProps {
  sources?: Record<string, Source>;
}

export default function EvidenceNotes({ sources }: EvidenceNotesProps) {
  if (!sources || Object.keys(sources).length === 0) return null;

  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Sources used</h3>
      <div className="space-y-2 text-xs text-gray-600">
        {Object.entries(sources).map(([key, source]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span> {source.type}
            {source.suggestedQuery && (
              <span className="text-gray-500 ml-2">({source.suggestedQuery})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
