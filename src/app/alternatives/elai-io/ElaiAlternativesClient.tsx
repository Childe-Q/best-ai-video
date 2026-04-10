'use client';

import LegacyDossierAlternativesClient, {
  type LegacyDossierAlternativesData,
} from '@/components/alternatives/LegacyDossierAlternativesClient';

interface ElaiAlternativesClientProps {
  data: LegacyDossierAlternativesData;
}

export default function ElaiAlternativesClient({ data }: ElaiAlternativesClientProps) {
  return <LegacyDossierAlternativesClient data={data} />;
}
