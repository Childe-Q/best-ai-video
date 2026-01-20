import { AlternativeGroup, AlternativeGroupWithEvidence } from './types';
import AlternativeToolCardV2 from './AlternativeToolCardV2';

interface AlternativesReasonGroupProps {
  group: AlternativeGroup | AlternativeGroupWithEvidence;
  expandedCards: Set<string>;
  onToggleCard: (cardId: string) => void;
  currentSlug?: string;
}

export default function AlternativesReasonGroup({
  group,
  expandedCards,
  onToggleCard,
  currentSlug
}: AlternativesReasonGroupProps) {
  // Only show Editorial tools (bestMatch), filter out Sponsored/Deals
  const hasStructuredRecommendations = 'bestMatch' in group && group.bestMatch !== undefined;
  
  const editorialTools = hasStructuredRecommendations 
    ? (group.bestMatch || [])
    : (group.tools || []).slice(0, 10); // Limit to 10 tools max

  return (
    <div>
      {/* Editorial Tools Grid */}
      {editorialTools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {editorialTools.map((tool) => {
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
