import { VsComparison, VsDisplayCondition, VsExternalValidationItem, VsFaqItem, VsFactItem, VsIntentProfile } from '@/types/vs';
import { getTool } from '@/lib/getTool';
import { buildVsFaqFirstQuestion, buildVsPairCopy, classifyVsPairType } from '@/lib/vsPairType';

type VsPageModelArgs = {
  comparison: VsComparison;
  toolAName: string;
  toolBName: string;
};

export type VsPageModel = {
  faqItems: Array<VsFaqItem & { sourceHint?: string }>;
  faqJsonLd: Record<string, unknown> | null;
  hardDataFacts: VsFactItem[];
  externalProofItems: VsExternalValidationItem[];
  sectionFlags: {
    hardDataComparison: boolean;
    externalProof: boolean;
  };
  derivedCopy: {
    quickVerdict: string | null;
    hardDataIntro: string | null;
    externalValidationIntro: string | null;
  };
};

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitizeSentence(value: string): string {
  const cleaned = sanitizeText(value).replace(/\s*([.?!,:;])\s*/g, '$1 ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return /[.?!]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function isDisplayConditionMet(
  condition: VsDisplayCondition | undefined,
  intentProfile: VsIntentProfile | undefined,
  facts: VsFactItem[],
  externalValidation: VsExternalValidationItem[],
): boolean {
  if (!condition) return true;

  if (condition.intents?.length) {
    const activeIntents = new Set(intentProfile?.intents ?? []);
    const matchedIntent = condition.intents.some((intent) => activeIntents.has(intent));
    if (!matchedIntent) return false;
  }

  if (condition.requiresFacts?.length) {
    const factKeys = new Set(facts.map((fact) => fact.key));
    const hasRequiredFacts = condition.requiresFacts.every((key) => factKeys.has(key));
    if (!hasRequiredFacts) return false;
  }

  if (condition.requiresExternalValidation && externalValidation.length === 0) {
    return false;
  }

  return true;
}

function buildFallbackFaq(comparison: VsComparison, toolAName: string, toolBName: string): VsFaqItem[] {
  const toolA = getTool(comparison.slugA);
  const toolB = getTool(comparison.slugB);
  const pairType = toolA && toolB ? classifyVsPairType(toolA, toolB, comparison.intentProfile) : null;
  const firstAnswer = sanitizeSentence(comparison.shortAnswer.a);
  const secondAnswer = sanitizeSentence(comparison.shortAnswer.b);
  const keyDiff = comparison.keyDiffs[0];

  return [
    {
      question:
        toolA && toolB && pairType
          ? buildVsFaqFirstQuestion(pairType, toolA, toolB)
          : `${toolAName} vs ${toolBName}: which should I choose first?`,
      answer: `${firstAnswer} ${secondAnswer}`.trim(),
    },
    {
      question: 'What is the main workflow difference?',
      answer: keyDiff
        ? `${toolAName}: ${sanitizeSentence(keyDiff.a)} ${toolBName}: ${sanitizeSentence(keyDiff.b)}`
        : `${toolAName} and ${toolBName} differ most in workflow, delivery style, and team fit.`,
    },
    {
      question: 'Can a team use both tools in one workflow?',
      answer:
        'Yes. Teams sometimes use one tool for new draft creation and another for repurposing, localization, or structured communication when the workflow spans more than one job.',
    },
  ];
}

export function buildVsPageModel({ comparison, toolAName, toolBName }: VsPageModelArgs): VsPageModel {
  const facts = (comparison.facts ?? []).filter((item) =>
    isDisplayConditionMet(item.displayCondition, comparison.intentProfile, comparison.facts ?? [], comparison.externalValidation ?? []),
  );
  const externalValidation = (comparison.externalValidation ?? []).filter((item) =>
    isDisplayConditionMet(item.displayCondition, comparison.intentProfile, comparison.facts ?? [], comparison.externalValidation ?? []),
  );

  const toolA = getTool(comparison.slugA);
  const toolB = getTool(comparison.slugB);
  const pairCopy = toolA && toolB ? buildVsPairCopy(toolA, toolB, comparison.intentProfile) : null;

  const normalizedFaq = comparison.faq?.length
    ? comparison.faq.map((item, index) => {
        if (index !== 0 || !toolA || !toolB) return item;
        const genericQuestion = /which should i choose first\?/i.test(item.question);
        return genericQuestion
          ? {
              ...item,
              question: buildVsFaqFirstQuestion(pairCopy?.pairType ?? classifyVsPairType(toolA, toolB, comparison.intentProfile), toolA, toolB),
            }
          : item;
      })
    : buildFallbackFaq(comparison, toolAName, toolBName);

  const rawFaq = normalizedFaq.filter((item) =>
    isDisplayConditionMet(item.displayCondition, comparison.intentProfile, comparison.facts ?? [], comparison.externalValidation ?? []),
  );

  const faqItems = rawFaq.map((item) => ({
    ...item,
    question: sanitizeText(item.question),
    answer: sanitizeText(item.answer),
    ...(item.sourceHint ? { sourceHint: sanitizeText(item.sourceHint) } : {}),
  }));

  const faqJsonLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null;

  const quickVerdict =
    comparison.derived?.quickVerdict ??
    (comparison.decisionSummary ? sanitizeText(comparison.decisionSummary) : null);

  const hardDataIntro =
    comparison.derived?.hardDataIntro ??
    (facts.length > 0 ? 'Use these source-backed checks when the buying debate comes down to workflow, pricing, or delivery format.' : null);

  const externalValidationIntro =
    comparison.derived?.externalValidationIntro ??
    (externalValidation.length > 0 ? 'These notes do not replace the verdict. They give you a cleaner trail of source-backed proof and outside signals.' : null);

  return {
    faqItems,
    faqJsonLd,
    hardDataFacts: facts,
    externalProofItems: externalValidation,
    sectionFlags: {
      hardDataComparison: facts.length > 0,
      externalProof: externalValidation.length > 0,
    },
    derivedCopy: {
      quickVerdict,
      hardDataIntro,
      externalValidationIntro,
    },
  };
}

export function buildVsFaqJsonLd(comparison: VsComparison, toolAName: string, toolBName: string): Record<string, unknown> | null {
  return buildVsPageModel({ comparison, toolAName, toolBName }).faqJsonLd;
}

export function summarizeFactKeys(facts: VsFactItem[] | undefined): string[] {
  return dedupe((facts ?? []).map((fact) => fact.key));
}
