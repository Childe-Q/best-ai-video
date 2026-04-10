import { AlternativeGroup, AlternativeGroupWithEvidence } from './types';
import AlternativeToolCardV2 from './AlternativeToolCardV2';

interface AlternativesReasonGroupProps {
  group: AlternativeGroup | AlternativeGroupWithEvidence;
  displayTools: Array<AlternativeGroup['tools'][number] | AlternativeGroupWithEvidence['tools'][number]>;
  expandedCards: Set<string>;
  onToggleCard: (cardId: string) => void;
  currentSlug?: string;
}

export default function AlternativesReasonGroup({
  group,
  displayTools,
  expandedCards,
  onToggleCard,
  currentSlug
}: AlternativesReasonGroupProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        {group.title}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Use this group to narrow your choice based on this scenario.
      </p>
      {/* Editorial Tools Grid */}
      {displayTools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayTools.map((tool) => {
            const cardId = `${group.id}-${tool.slug}`;
            return (
              <AlternativeToolCardV2
                key={cardId}
                tool={tool}
                cardId={cardId}
                isExpanded={expandedCards.has(cardId)}
                onToggle={() => onToggleCard(cardId)}
                currentSlug={currentSlug}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
