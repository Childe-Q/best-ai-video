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
  // The commonIssues format from JSON is: { point, flag, sourceType?, url? }
  // We need to transform it to: { claim, impact, whatToDo }
  const commonIssues = data.commonIssues?.slice(0, 8).map(issue => {
    // Determine impact based on flag
    const impact = issue.flag === 'Official' 
      ? 'Official policy or documented limitation' 
      : 'Reported by users';
    
    // Generate whatToDo based on flag
    const whatToDo = issue.flag === 'Official'
      ? 'Check the official documentation or terms of service for details'
      : 'Verify with official sources or contact support if this affects your use case';
    
    return {
      claim: issue.point,
      impact,
      whatToDo
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
        
        {/* 1. User feedback snapshot */}
        {(likes.length > 0 || complaints.length > 0) && (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User feedback snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What users like */}
              {likes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What users like</h3>
                  <ul className="space-y-2">
                    {likes.map((like, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{like}</span>
                      </li>
                    ))}
                    {/* Add neutral items to likes if there's space */}
                    {neutral.length > 0 && likes.length < 6 && (
                      <>
                        {neutral.slice(0, 6 - likes.length).map((item, idx) => (
                          <li key={`neutral-${idx}`} className="flex items-start gap-2 text-gray-700">
                            <span className="text-gray-400 font-bold shrink-0 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </div>
              )}
              {/* Common complaints */}
              {complaints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Common complaints</h3>
                  <ul className="space-y-2">
                    {complaints.map((complaint, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                        <span>{complaint}</span>
                      </li>
                    ))}
                    {/* Add neutral items to complaints if likes column is empty and there's space */}
                    {neutral.length > 0 && likes.length === 0 && complaints.length < 6 && (
                      <>
                        {neutral.slice(0, 6 - complaints.length).map((item, idx) => (
                          <li key={`neutral-${idx}`} className="flex items-start gap-2 text-gray-700">
                            <span className="text-gray-400 font-bold shrink-0 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Common issues to know before you pay */}
        {commonIssues.length > 0 && (
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Common issues to know before you pay</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonIssues.map((issue, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <p className="text-sm font-medium text-gray-900 mb-2">{issue.claim}</p>
                  <p className="text-xs text-gray-600 mb-3">
                    <span className="font-medium">Impact: </span>{issue.impact}
                  </p>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">What to do: </span>{issue.whatToDo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Frequently asked questions */}
        {faqs.length > 0 && (
          <div className="w-full">
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
              <FAQAccordion faqs={faqs} />
            </div>
          </div>
        )}

        {/* Sources */}
        <div className="w-full text-center">
          <p className="text-xs text-gray-500">
            Based on public docs + aggregated user feedback. Limits may vary by account.
          </p>
        </div>
      </div>
    </section>
  );
}
