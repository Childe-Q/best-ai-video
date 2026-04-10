'use client';

import LegacyDossierAlternativesClient, {
  type LegacyDossierAlternativesData,
} from '@/components/alternatives/LegacyDossierAlternativesClient';

interface ZebracatAlternativesClientProps {
  data: LegacyDossierAlternativesData;
}

export default function ZebracatAlternativesClient({ data }: ZebracatAlternativesClientProps) {
  return <LegacyDossierAlternativesClient data={data} />;
}
