import FAQAccordion from '@/components/FAQAccordion';

export interface ReviewsPageData {
  userFeedbackSnapshot?: Array<{
    point: string;
    type: 'positive' | 'neutral' | 'negative';
    sourceType?: string;
    url?: string;
  }>;
  commonIssues?: Array<{
    point: string;
    flag: 'Official' | 'User feedback';
    sourceType?: string;
    url?: string;
  }>;
  faqs?: Array<{
    q: string;
    a: string;
    confidence?: 'confirmed' | 'unconfirmed';
  }>;
}

interface ReviewsPageTemplateProps {
  toolSlug: string;
  data: ReviewsPageData;
}

export default function ReviewsPageTemplate({ toolSlug, data }: ReviewsPageTemplateProps) {
  // Transform userFeedbackSnapshot to the format expected by the UI
  // Filter and limit to max 6 items per type
  const likes = data.userFeedbackSnapshot
    ?.filter(item => item.type === 'positive')
    .slice(0, 6)
    .map(item => item.point) || [];
  
  const complaints = data.userFeedbackSnapshot
    ?.filter(item => item.type === 'negative')
    .slice(0, 6)
    .map(item => item.point) || [];
  
  // Neutral feedback can be shown in either column if space allows
  const neutral = data.userFeedbackSnapshot
    ?.filter(item => item.type === 'neutral')
    .slice(0, 3)
    .map(item => item.point) || [];

  // Transform commonIssues to the format expected by the UI
  // The commonIssues format from JSON is: { point, flag, sourceType?, url?, _action? }
  // We transform it to: { title, evidenceType, action }
  const cleanActionText = (text: string): string => {
    return text
      .replace(/\s*use\s+case\s*$/i, '') // Remove trailing "use case"
      .replace(/\s*\{useCase\}\s*/gi, '') // Remove {useCase} variable
      .replace(/\s*\$?\{use_case\}\s*/gi, '') // Remove ${use_case} variable
      .replace(/\s*useCase\s*/gi, '') // Remove useCase variable
      .trim();
  };
  
  const getDefaultAction = (evidenceType: 'user' | 'official'): string => {
    if (evidenceType === 'official') {
      return 'Check official docs or terms of service for details.';
    }
    return 'Check official docs or ask support before upgrading.';
  };
  
  const commonIssues = data.commonIssues?.slice(0, 8).map(issue => {
    // Determine evidenceType based on flag
    const evidenceType = issue.flag === 'Official' ? 'official' : 'user';
    
    // Get action from _action property if available, otherwise use default
    const rawAction = (issue as any)._action;
    const action = rawAction 
      ? cleanActionText(rawAction) 
      : getDefaultAction(evidenceType);
    
    return {
      title: issue.point,
      evidenceType: evidenceType as 'user' | 'official' | 'mixed',
      action: action || getDefaultAction(evidenceType)
    };
  }) || [];

  // Transform FAQs to the format expected by FAQAccordion
  const faqs = data.faqs?.slice(0, 8).map(faq => ({
    question: faq.q,
    answer: faq.a
  })) || [];

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 lg:px-24 space-y-8">
        
        {/* 1. User feedback snapshot - Only show if >= 2 items */}
        {(likes.length + complaints.length >= 2) && (
          <div className="w-full bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">User feedback snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What users like - Only show if we have likes */}
              {likes.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-5">What users like</h3>
                  <ul className="space-y-3">
                    {likes.map((like, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 text-base leading-[1.65]">
                        <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="font-semibold">{like}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Common complaints - Use ⚠️ if no likes, otherwise use neutral styling */}
              {complaints.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Common complaints</h3>
                  <ul className="space-y-3">
                    {complaints.map((complaint, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 text-base leading-[1.65]">
                        {/* Use ⚠️ if no likes (neutral tone), otherwise use ✕ */}
                        <span className={`${likes.length === 0 ? 'text-orange-500' : 'text-red-500'} font-bold shrink-0 mt-0.5`}>
                          {likes.length === 0 ? '⚠️' : '✕'}
                        </span>
                        <span className="font-semibold">{complaint}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Add source note only once at the bottom */}
                  {complaints.length > 0 && (
                    <p className="text-base text-gray-500 mt-5 italic leading-[1.65]">
                      Based on user reports; details vary by plan/account.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Common issues to know before you pay - Only show if >= 2 items */}
        {commonIssues.length >= 2 && (
          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Common issues to know before you pay</h2>
            
            {/* Legend: Show source types once at the top */}
            <div className="mb-6 flex flex-wrap items-center gap-4 text-base text-gray-600">
              <span>Reported by users</span>
              {commonIssues.some(issue => issue.evidenceType === 'official' || issue.evidenceType === 'mixed') && (
                <span>From docs</span>
              )}
            </div>
            
            {/* Adaptive grid layout based on issue count */}
            {(() => {
              const count = commonIssues.length;
              
              // Helper function to render a single card
              const renderCard = (issue: typeof commonIssues[0], idx: number) => {
                const showBadge = issue.evidenceType !== 'user';
                const badgeText = issue.evidenceType === 'official' 
                  ? 'From docs' 
                  : issue.evidenceType === 'mixed' 
                  ? 'Mixed' 
                  : '';
                
                return (
                  <div key={idx} className="relative bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] transition-all duration-200 p-6">
                    {/* Optional badge in top-right corner (only for non-user sources) */}
                    {showBadge && badgeText && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700">
                          {badgeText}
                        </span>
                      </div>
                    )}
                    
                    {/* Title: Problem statement (12-16 words max) */}
                    <p className={`text-base font-semibold text-gray-900 ${showBadge ? 'pr-20' : ''} mb-3 leading-[1.65]`}>
                      {issue.title}
                    </p>
                    
                    {/* Action: One sentence recommendation (max 18 words) */}
                    <p className="text-base text-gray-700 leading-[1.65]">
                      <span className="font-semibold">Action: </span>
                      {issue.action || 'Check official docs or ask support before upgrading.'}
                    </p>
                  </div>
                );
              };
              
              if (count <= 4) {
                // 2x2 grid for 2-4 items
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {commonIssues.map((issue, idx) => renderCard(issue, idx))}
                  </div>
                );
              } else if (count === 5) {
                // 3 + 2 layout: first row 3 cards, second row 2 cards centered
                return (
                  <div className="space-y-4">
                    {/* First row: 3 cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {commonIssues.slice(0, 3).map((issue, idx) => renderCard(issue, idx))}
                    </div>
                    {/* Second row: 2 cards centered */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="hidden md:block"></div> {/* Empty spacer */}
                      {commonIssues.slice(3, 5).map((issue, idx) => renderCard(issue, idx + 3))}
                      <div className="hidden md:block"></div> {/* Empty spacer */}
                    </div>
                  </div>
                );
              } else {
                // 3 columns for 6+ items
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {commonIssues.map((issue, idx) => renderCard(issue, idx))}
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* 3. Frequently asked questions - Always show if >= 3 items */}
        {faqs.length >= 3 && (
          <div className="w-full">
            <div className="w-full bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
              <FAQAccordion faqs={faqs} />
            </div>
          </div>
        )}

        {/* Sources */}
        <div className="w-full text-center">
          <p className="text-base text-gray-500 leading-[1.65]">
            Based on public docs + aggregated user feedback. Limits may vary by account.
          </p>
        </div>
      </div>
    </section>
  );
}
