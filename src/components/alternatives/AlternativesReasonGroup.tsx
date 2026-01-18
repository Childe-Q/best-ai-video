import { AlternativeGroup, AlternativeGroupWithEvidence, AlternativeTool, AlternativeToolWithEvidence } from './types';
import AlternativeToolCard from './AlternativeToolCard';

interface AlternativesReasonGroupProps {
  group: AlternativeGroup | AlternativeGroupWithEvidence;
  expandedCards: Set<string>;
  onToggleCard: (cardId: string) => void;
  onShowEvidence: (links: string[], toolName: string) => void;
}

export default function AlternativesReasonGroup({
  group,
  expandedCards,
  onToggleCard,
  onShowEvidence
}: AlternativesReasonGroupProps) {
  return (
    <section id={group.id} className="scroll-mt-[140px]">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2">
          {group.title}
        </h2>
        <p className="text-lg text-gray-600 font-medium">
          {group.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {group.tools.map((tool) => {
          const cardId = `${group.id}-${tool.slug}`;
          return (
            <AlternativeToolCard
              key={cardId}
              tool={tool}
              cardId={cardId}
              isExpanded={expandedCards.has(cardId)}
              onToggle={() => onToggleCard(cardId)}
              onShowEvidence={onShowEvidence}
            />
          );
        })}
      </div>
    </section>
  );
}
