import toolsData from '@/data/tools.json';
import { getHomeCardPriceBlock, getFeatureSeedCardPriceBlock } from '@/lib/pricing/cardPriceBlock';
import type { Tool } from '@/types/tool';

function printHomeAudit() {
  console.log('HOME CARD PRICE BLOCKS');
  for (const tool of toolsData as Tool[]) {
    const block = getHomeCardPriceBlock(tool);
    console.log(
      [
        tool.slug,
        block.priceState,
        block.priceLabel,
        block.pricePrimary,
        block.priceHelper ?? '-',
        block.priceSourceKind,
        block.priceConfidence,
        block.priceHintKind,
      ].join('\t'),
    );
  }
}

function printFeatureSeedSamples() {
  console.log('\nFEATURE SEED SAMPLES');
  const samples = [
    'From $29/mo (Creator)',
    'Free plan available; paid from $7.99/mo (Pro: $15/mo annually)',
    'Enterprise: custom pricing, unlimited minutes',
    'Free',
    'Annual plans from $24/mo billed yearly',
    null,
  ];

  for (const sample of samples) {
    const block = getFeatureSeedCardPriceBlock(sample);
    console.log(
      [
        sample ?? 'null',
        block.priceState,
        block.priceLabel,
        block.pricePrimary,
        block.priceHelper ?? '-',
        block.priceHintKind,
      ].join('\t'),
    );
  }
}

printHomeAudit();
printFeatureSeedSamples();
