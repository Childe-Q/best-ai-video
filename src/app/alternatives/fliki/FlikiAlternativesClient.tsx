'use client';

import LegacyDossierAlternativesClient, {
  type LegacyDossierAlternativesData,
} from '@/components/alternatives/LegacyDossierAlternativesClient';

interface FlikiAlternativesClientProps {
  data: LegacyDossierAlternativesData;
}

export default function FlikiAlternativesClient({ data }: FlikiAlternativesClientProps) {
  return <LegacyDossierAlternativesClient data={data} />;
}
