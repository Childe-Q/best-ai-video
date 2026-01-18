import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';
import { getRelatedComparisons } from './getRelatedLinks';

export interface FAQ {
  question: string;
  answer: string;
}

interface FAQContext {
  tool: Tool;
  content: ToolContent | null;
  rawFaqs: FAQ[];
  slug: string;
}

/**
 * Smart FAQ generation with decision-path ordering
 * Returns exactly 8 FAQs sorted by user decision priority
 */
export function generateSmartFAQs(context: FAQContext): FAQ[] {
  const { tool, content, rawFaqs, slug } = context;
  
  // Extract tool metadata for FAQ generation
  const hasFreePlan = tool.pricing_plans?.some(p => {
    if (typeof p.price === 'string') return p.price.toLowerCase() === 'free';
    if (typeof p.price === 'object' && p.price !== null && 'monthly' in p.price) {
      const monthly = p.price.monthly;
      if (typeof monthly === 'object' && monthly !== null && 'amount' in monthly) {
        return monthly.amount === 0;
      }
    }
    return false;
  }) || tool.pricing?.free_plan?.exists || false;
  
  const hasWatermark = hasFreePlan && (
    tool.key_facts?.some(f => f.toLowerCase().includes('watermark')) ||
    content?.features?.keyFeatures?.some(f => f.toLowerCase().includes('watermark')) ||
    tool.pros?.some(p => p.toLowerCase().includes('watermark')) ||
    tool.cons?.some(c => c.toLowerCase().includes('watermark'))
  );
  
  const hasCredits = !!(tool.key_facts?.some(f => 
    f.toLowerCase().includes('credit') || f.toLowerCase().includes('minute')
  ) || content?.features?.keyFeatures?.some(f =>
    f.toLowerCase().includes('credit') || f.toLowerCase().includes('minute')
  ) || tool.pros?.some(p =>
    p.toLowerCase().includes('credit') || p.toLowerCase().includes('minute')
  ) || tool.cons?.some(c =>
    c.toLowerCase().includes('credit') || c.toLowerCase().includes('minute')
  ));
  
  const hasRefundIssues = !!(tool.key_facts?.some(f =>
    f.toLowerCase().includes('refund') || f.toLowerCase().includes('cancel')
  ) || tool.cons?.some(c =>
    c.toLowerCase().includes('refund') || c.toLowerCase().includes('cancel')
  ) || content?.reviews?.reviewHighlights?.commonIssues?.some(i =>
    i.claim.toLowerCase().includes('refund') || i.claim.toLowerCase().includes('cancel')
  ));
  
  // Categorize existing FAQs
  const categorizedFaqs = categorizeFAQs(rawFaqs, {
    hasFreePlan,
    hasWatermark,
    hasCredits,
    hasRefundIssues,
    tool,
    content,
    slug
  });
  
  // Build 8-position FAQ array following decision path
  const orderedFAQs: (FAQ | null)[] = new Array(8).fill(null);
  const usedQuestions = new Set<string>();
  
  // Q1: Core unique selling point / use case
  orderedFAQs[0] = findOrGenerateFAQ(categorizedFaqs.coreUseCase, 0, {
    type: 'coreUseCase',
    tool,
    content
  });
  if (orderedFAQs[0]) {
    usedQuestions.add(normalizeQuestion(orderedFAQs[0].question));
  }
  
  // Q2: Credits/minutes consumption (avoid "Is it free?" if watermark will be Q3)
  if (hasCredits) {
    const creditsFAQ = findOrGenerateFAQ(
      categorizedFaqs.credits.filter(f => {
        const q = normalizeQuestion(f.question);
        return !q.includes('free') || !hasWatermark; // Skip "Is it free?" if watermark is coming
      }),
      1,
      {
        type: 'credits',
        tool,
        content
      }
    );
    orderedFAQs[1] = creditsFAQ;
    if (creditsFAQ) {
      usedQuestions.add(normalizeQuestion(creditsFAQ.question));
    }
  } else {
    orderedFAQs[1] = findOrGenerateFAQ(categorizedFaqs.exportLimits, 1, {
      type: 'exportLimits',
      tool,
      content
    });
    if (orderedFAQs[1]) {
      usedQuestions.add(normalizeQuestion(orderedFAQs[1].question));
    }
  }
  
  // Q3: Export resolution / watermark (only if Free plan exists)
  // Ensure watermark and "Is it free?" don't both appear in first 3
  if (hasWatermark) {
    const watermarkFAQ = findOrGenerateFAQ(categorizedFaqs.watermark, 2, {
      type: 'watermark',
      tool,
      content
    });
    orderedFAQs[2] = watermarkFAQ;
    if (watermarkFAQ) {
      usedQuestions.add(normalizeQuestion(watermarkFAQ.question));
    }
  } else if (hasFreePlan) {
    const resolutionFAQ = findOrGenerateFAQ(categorizedFaqs.resolution, 2, {
      type: 'resolution',
      tool,
      content
    });
    orderedFAQs[2] = resolutionFAQ;
    if (resolutionFAQ) {
      usedQuestions.add(normalizeQuestion(resolutionFAQ.question));
    }
  }
  
  // Q4: Commercial use / licensing
  orderedFAQs[3] = findOrGenerateFAQ(
    categorizedFaqs.commercial.filter(f => !usedQuestions.has(normalizeQuestion(f.question))),
    3,
    {
      type: 'commercial',
      tool,
      content
    }
  );
  if (orderedFAQs[3]) {
    usedQuestions.add(normalizeQuestion(orderedFAQs[3].question));
  }
  
  // Q5: Cancellation / refunds
  if (hasRefundIssues) {
    orderedFAQs[4] = findOrGenerateFAQ(
      categorizedFaqs.refunds.filter(f => !usedQuestions.has(normalizeQuestion(f.question))),
      4,
      {
        type: 'refunds',
        tool,
        content
      }
    );
  } else {
    orderedFAQs[4] = findOrGenerateFAQ(
      categorizedFaqs.cancellation.filter(f => !usedQuestions.has(normalizeQuestion(f.question))),
      4,
      {
        type: 'cancellation',
        tool,
        content
      }
    );
  }
  if (orderedFAQs[4]) {
    usedQuestions.add(normalizeQuestion(orderedFAQs[4].question));
  }
  
  // Q6: Export formats / subtitles / downloadable content
  orderedFAQs[5] = findOrGenerateFAQ(
    categorizedFaqs.exportFormats.filter(f => !usedQuestions.has(normalizeQuestion(f.question))),
    5,
    {
      type: 'exportFormats',
      tool,
      content
    }
  );
  if (orderedFAQs[5]) {
    usedQuestions.add(normalizeQuestion(orderedFAQs[5].question));
  }
  
  // Q7: Browser / stability / common issues
  orderedFAQs[6] = findOrGenerateFAQ(
    categorizedFaqs.stability.filter(f => !usedQuestions.has(normalizeQuestion(f.question))),
    6,
    {
      type: 'stability',
      tool,
      content
    }
  );
  if (orderedFAQs[6]) {
    usedQuestions.add(normalizeQuestion(orderedFAQs[6].question));
  }
  
  // Q8: Comparison / alternative tool question
  orderedFAQs[7] = findOrGenerateFAQ(
    categorizedFaqs.comparison.filter(f => !usedQuestions.has(normalizeQuestion(f.question))),
    7,
    {
      type: 'comparison',
      tool,
      content,
      slug
    }
  );
  if (orderedFAQs[7]) {
    usedQuestions.add(normalizeQuestion(orderedFAQs[7].question));
  }
  
  // Fill remaining slots with neutral operational questions
  const filledFAQs = orderedFAQs.filter(f => f !== null) as FAQ[];
  
  const remainingSlots = 8 - filledFAQs.length;
  
  if (remainingSlots > 0) {
    // Get all unused FAQs (from all categories)
    const allUnusedFAQs = [
      ...categorizedFaqs.coreUseCase,
      ...categorizedFaqs.credits,
      ...categorizedFaqs.exportLimits,
      ...categorizedFaqs.watermark,
      ...categorizedFaqs.resolution,
      ...categorizedFaqs.commercial,
      ...categorizedFaqs.refunds,
      ...categorizedFaqs.cancellation,
      ...categorizedFaqs.exportFormats,
      ...categorizedFaqs.stability,
      ...categorizedFaqs.comparison,
      ...categorizedFaqs.neutral
    ].filter(faq => !usedQuestions.has(normalizeQuestion(faq.question)));
    
    // Remove duplicates
    const uniqueUnusedFAQs: FAQ[] = [];
    const seen = new Set<string>();
    for (const faq of allUnusedFAQs) {
      const normalized = normalizeQuestion(faq.question);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueUnusedFAQs.push(faq);
      }
    }
    
    filledFAQs.push(...uniqueUnusedFAQs.slice(0, remainingSlots));
  }
  
  // Ensure exactly 8 FAQs, filter out [NEED VERIFICATION] if answer is empty after filtering
  const finalFAQs = filledFAQs.slice(0, 8).map(faq => {
    // Clean [NEED VERIFICATION] from answers, but keep the answer if it has other content
    let cleanedAnswer = faq.answer.replace(/\[NEED VERIFICATION\]/g, '').trim();
    if (cleanedAnswer.length === 0) {
      cleanedAnswer = 'This information needs verification. Check the official help documentation or pricing page for details.';
    }
    return {
      question: faq.question,
      answer: cleanedAnswer
    };
  });
  
  return finalFAQs;
}

interface CategorizedFAQs {
  coreUseCase: FAQ[];
  credits: FAQ[];
  exportLimits: FAQ[];
  watermark: FAQ[];
  resolution: FAQ[];
  commercial: FAQ[];
  refunds: FAQ[];
  cancellation: FAQ[];
  exportFormats: FAQ[];
  stability: FAQ[];
  comparison: FAQ[];
  neutral: FAQ[];
}

function categorizeFAQs(
  faqs: FAQ[],
  context: {
    hasFreePlan: boolean;
    hasWatermark: boolean;
    hasCredits: boolean;
    hasRefundIssues: boolean;
    tool: Tool;
    content: ToolContent | null;
    slug: string;
  }
): CategorizedFAQs {
  const categorized: CategorizedFAQs = {
    coreUseCase: [],
    credits: [],
    exportLimits: [],
    watermark: [],
    resolution: [],
    commercial: [],
    refunds: [],
    cancellation: [],
    exportFormats: [],
    stability: [],
    comparison: [],
    neutral: []
  };
  
  for (const faq of faqs) {
    const q = faq.question.toLowerCase();
    const a = faq.answer.toLowerCase();
    
    // Core use case / unique selling point
    if (
      q.includes('best for') || q.includes('use case') || q.includes('who should') ||
      q.includes('ideal for') || q.includes('suitable for') || q.includes('what is') ||
      q.includes('what does') || q.includes('how does') && (q.includes('work') || q.includes('create'))
    ) {
      categorized.coreUseCase.push(faq);
    }
    // Credits / minutes
    else if (q.includes('credit') || q.includes('minute') || q.includes('usage') || q.includes('quota')) {
      categorized.credits.push(faq);
    }
    // Export limits
    else if (q.includes('limit') || q.includes('maximum') || q.includes('how many')) {
      categorized.exportLimits.push(faq);
    }
    // Watermark
    else if (q.includes('watermark') || (q.includes('free') && a.includes('watermark'))) {
      categorized.watermark.push(faq);
    }
    // Resolution
    else if (q.includes('resolution') || q.includes('720p') || q.includes('1080p') || q.includes('4k')) {
      categorized.resolution.push(faq);
    }
    // Commercial use
    else if (q.includes('commercial') || q.includes('license') || q.includes('monetize')) {
      categorized.commercial.push(faq);
    }
    // Refunds
    else if (q.includes('refund') || (q.includes('cancel') && a.includes('refund'))) {
      categorized.refunds.push(faq);
    }
    // Cancellation
    else if (q.includes('cancel') || q.includes('subscription')) {
      categorized.cancellation.push(faq);
    }
    // Export formats
    else if (q.includes('format') || q.includes('export') || q.includes('download') || q.includes('subtitle') || q.includes('srt') || q.includes('vtt')) {
      categorized.exportFormats.push(faq);
    }
    // Stability / browser / issues
    else if (q.includes('browser') || q.includes('stable') || q.includes('issue') || q.includes('problem') || q.includes('fail') || q.includes('error')) {
      categorized.stability.push(faq);
    }
    // Comparison
    else if (q.includes('vs') || q.includes('versus') || q.includes('alternative') || q.includes('compare') || q.includes('difference')) {
      categorized.comparison.push(faq);
    }
    // Neutral / operational
    else {
      categorized.neutral.push(faq);
    }
  }
  
  return categorized;
}

function findOrGenerateFAQ(
  candidates: FAQ[],
  position: number,
  context: {
    type: string;
    tool: Tool;
    content: ToolContent | null;
    slug?: string;
  }
): FAQ | null {
  // If we have candidates, use the first one (best match)
  if (candidates.length > 0) {
    const faq = candidates[0];
    // Ensure answer style: user feedback must be prefixed
    let answer = faq.answer;
    
    // Check if answer contains user feedback indicators but doesn't have prefix
    const hasUserFeedback = answer.toLowerCase().includes('user report') ||
      answer.toLowerCase().includes('users report') ||
      answer.toLowerCase().includes('user feedback') ||
      answer.toLowerCase().includes('some users') ||
      answer.toLowerCase().includes('users say');
    
    if (hasUserFeedback && !answer.toLowerCase().startsWith('user feedback:') && 
        !answer.toLowerCase().startsWith('user reports:') && 
        !answer.toLowerCase().startsWith('users report:')) {
      // Add prefix if missing
      if (answer.toLowerCase().includes('user report') || answer.toLowerCase().includes('users report')) {
        answer = 'User reports: ' + answer;
      } else {
        answer = 'User feedback: ' + answer;
      }
    }
    
    return {
      question: faq.question,
      answer: answer
    };
  }
  
  // Otherwise, generate a neutral operational question
  return generateNeutralFAQ(position, context);
}

function generateNeutralFAQ(
  position: number,
  context: {
    type: string;
    tool: Tool;
    content: ToolContent | null;
    slug?: string;
  }
): FAQ | null {
  const { type, tool, content, slug } = context;
  
  switch (type) {
    case 'coreUseCase': {
      const bestFor = content?.reviews?.verdict?.bestFor || tool.best_for || tool.tagline;
      const bestForArray = Array.isArray(bestFor) ? bestFor : [bestFor];
      const useCase = content?.overview?.useCases?.[0]?.title || tool.target_audience_list?.[0] || 'content creators';
      
      return {
        question: `What is ${tool.name} best for?`,
        answer: `${tool.name} is best for ${bestForArray[0] || useCase}. ${tool.short_description || tool.tagline}.`
      };
    }
    
    case 'credits': {
      const hasVerification = tool.key_facts?.some(f => f.includes('[NEED VERIFICATION]')) ||
        content?.features?.keyFeatures?.some(f => f.includes('[NEED VERIFICATION]'));
      
      return {
        question: 'How do credits or minutes work?',
        answer: hasVerification
          ? 'Credit and minute consumption rules vary by plan and feature usage. [NEED VERIFICATION] Check the official pricing page and help documentation for specific limits and consumption rates for your plan.'
          : 'Credits or minutes are typically consumed based on video length, generation settings, and feature usage. Check your plan details on the pricing page for specific limits.'
      };
    }
    
    case 'exportLimits': {
      return {
        question: 'What are the generation or export limits?',
        answer: 'Limits vary by plan tier. Check the pricing page for specific quotas, export counts, and feature restrictions for each plan.'
      };
    }
    
    case 'watermark': {
      return {
        question: 'Do free plan videos have a watermark?',
        answer: 'Free plan exports typically include a watermark. Paid plans usually remove watermarks. Check the pricing page for your specific plan details.'
      };
    }
    
    case 'resolution': {
      const freePlan = tool.pricing_plans?.find(p => {
        if (typeof p.price === 'string') return p.price.toLowerCase() === 'free';
        if (typeof p.price === 'object' && p.price !== null && 'monthly' in p.price) {
          const monthly = p.price.monthly;
          if (typeof monthly === 'object' && monthly !== null && 'amount' in monthly) {
            return monthly.amount === 0;
          }
        }
        return false;
      });
      
      const freeRes = freePlan?.featureItems?.find(f => 
        f.text.toLowerCase().includes('720p') || f.text.toLowerCase().includes('1080p') || f.text.toLowerCase().includes('4k')
      )?.text || 'varies by plan';
      
      return {
        question: 'What export resolution do plans support?',
        answer: `Free plan exports are typically ${freeRes}. Paid plans offer higher resolutions (1080p or 4K depending on tier). Check the pricing page for specific resolution options.`
      };
    }
    
    case 'commercial': {
      return {
        question: 'Can I use videos commercially?',
        answer: 'Commercial usage rights depend on your plan tier. Free plans typically restrict commercial use. Paid plans usually include commercial licensing. Verify the exact terms in the official pricing page or terms of service.'
      };
    }
    
    case 'refunds': {
      return {
        question: 'What is the refund policy?',
        answer: 'Note: Official terms are typically stricter than expected. Refund policies vary and are typically evaluated case-by-case. Check the official terms of service or contact support for specific refund eligibility and procedures.'
      };
    }
    
    case 'cancellation': {
      return {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel your subscription from your account settings or billing dashboard. Cancellation typically takes effect at the end of your current billing cycle. Check the help documentation for specific steps.'
      };
    }
    
    case 'exportFormats': {
      return {
        question: 'What file formats can I export?',
        answer: 'Export formats typically include MP4 for video. Some plans may support additional formats like MOV, audio-only exports (MP3/WAV), or subtitle files (SRT/VTT). Check the features page or help documentation for your plan\'s specific export options.'
      };
    }
    
    case 'stability': {
      return {
        question: 'What browsers or system requirements are recommended?',
        answer: 'Most tools work best in modern browsers like Chrome or Edge. Some users report better stability and performance in Chrome. Check the official help documentation for specific browser and system requirements.'
      };
    }
    
    case 'comparison': {
      const comparisons = slug ? getRelatedComparisons(slug) : [];
      const comparisonText = comparisons.length > 0
        ? `See our comparison pages (e.g., ${comparisons[0]?.title}) for detailed differences.`
        : 'Check the alternatives page for tool comparisons and recommendations based on your use case.';
      
      return {
        question: `How does ${tool.name} compare to alternatives?`,
        answer: `${tool.name} focuses on ${tool.best_for || tool.tagline}. ${comparisonText}`
      };
    }
    
    default:
      return null;
  }
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}
