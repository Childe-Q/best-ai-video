interface Source {
  type: string;
  howToVerify: string;
  suggestedQuery?: string;
}

interface EvidenceNotesProps {
  sources?: Record<string, Source>;
}

type SourceCategory = 'youtube' | 'product' | 'help' | 'community';

type SourceSummaryItem = {
  category: SourceCategory;
  label: string;
  url?: string;
};

function getUrlFromSource(source: Source): string | undefined {
  const candidate = source.suggestedQuery?.trim();
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    return url.toString();
  } catch {
    return undefined;
  }
}

function detectSourceCategory(key: string, source: Source): SourceCategory | null {
  const normalized = `${key} ${source.type} ${source.howToVerify} ${source.suggestedQuery ?? ''}`.toLowerCase();

  if (normalized.includes('youtube')) return 'youtube';
  if (/(review|community|reddit|trustpilot|g2|user)/.test(normalized)) return 'community';
  if (/(help|support|documentation|docs)/.test(normalized)) return 'help';
  if (/(official|pricing|website|product|legal|terms|feature|export popup)/.test(normalized)) return 'product';

  return null;
}

function summarizeSources(sources: Record<string, Source>): SourceSummaryItem[] {
  const categoryMap = new Map<SourceCategory, SourceSummaryItem>();

  Object.entries(sources).forEach(([key, source]) => {
    const category = detectSourceCategory(key, source);
    if (!category || categoryMap.has(category)) return;

    if (category === 'youtube') {
      categoryMap.set(category, {
        category,
        label: 'Official YouTube channel and product demos',
        url: getUrlFromSource(source),
      });
      return;
    }

    if (category === 'community') {
      categoryMap.set(category, {
        category,
        label: 'Public review and community sources',
      });
      return;
    }
  });

  const hasProduct = Object.entries(sources).some(([key, source]) => detectSourceCategory(key, source) === 'product');
  const hasHelp = Object.entries(sources).some(([key, source]) => detectSourceCategory(key, source) === 'help');

  if (hasProduct && hasHelp) {
    categoryMap.set('product', {
      category: 'product',
      label: 'Official product pages and help center',
    });
  } else if (hasProduct) {
    categoryMap.set('product', {
      category: 'product',
      label: 'Official product pages',
    });
  } else if (hasHelp) {
    categoryMap.set('help', {
      category: 'help',
      label: 'Official help center and documentation',
    });
  }

  const order: SourceCategory[] = ['youtube', 'product', 'help', 'community'];
  return order
    .map((category) => categoryMap.get(category))
    .filter((item): item is SourceSummaryItem => Boolean(item));
}

export default function EvidenceNotes({ sources }: EvidenceNotesProps) {
  if (!sources || Object.keys(sources).length === 0) return null;

  const items = summarizeSources(sources);
  if (items.length === 0) return null;

  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Sources used</h3>
      <div className="space-y-2 text-sm text-gray-600">
        {items.map((item) => (
          <div key={item.category}>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-800 hover:text-indigo-700 underline decoration-slate-300 underline-offset-2"
              >
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-slate-800">{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
