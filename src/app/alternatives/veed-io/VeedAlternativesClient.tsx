'use client';

import LegacyDossierAlternativesClient, {
  type LegacyDossierAlternativesData,
} from '@/components/alternatives/LegacyDossierAlternativesClient';

interface VeedAlternativesClientProps {
  data: LegacyDossierAlternativesData;
}

export default function VeedAlternativesClient({ data }: VeedAlternativesClientProps) {
  return <LegacyDossierAlternativesClient data={data} />;
}
