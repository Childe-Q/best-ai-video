'use client';

import { AlternativeTool, AlternativeToolWithEvidence } from './types';
import AlternativeToolCardV2 from './AlternativeToolCardV2';

interface AlternativeToolCardProps {
  tool: AlternativeTool | AlternativeToolWithEvidence;
  cardId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onShowEvidence: (links: string[], toolName: string) => void;
}

export default function AlternativeToolCard(props: AlternativeToolCardProps) {
  return <AlternativeToolCardV2 {...props} detailMode="full" onShowEvidence={props.onShowEvidence} />;
}
