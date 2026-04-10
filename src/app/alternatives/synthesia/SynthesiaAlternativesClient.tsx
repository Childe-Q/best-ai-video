'use client';

import LegacyDossierAlternativesClient, {
  type LegacyDossierAlternativesData,
} from '@/components/alternatives/LegacyDossierAlternativesClient';

interface SynthesiaAlternativesClientProps {
  data: LegacyDossierAlternativesData;
}

export default function SynthesiaAlternativesClient({ data }: SynthesiaAlternativesClientProps) {
  return <LegacyDossierAlternativesClient data={data} />;
}
