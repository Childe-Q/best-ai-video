import { PricingPlan } from '@/types/tool';

export interface ComparableAttribute {
  key: string;
  label: string;
  valuesByPlanId: Record<string, string>;
  coverage: number; // How many plans have a value (non-empty)
  variance: number; // How many unique values exist
}

/**
 * Extract all text content from a plan for dimension extraction
 */
function collectPlanText(plan: PricingPlan): string[] {
  const texts: string[] = [];
  
  // From featureItems
  if (plan.featureItems) {
    texts.push(...plan.featureItems.map(item => item.text));
  }
  
  // From highlights
  if (plan.highlights) {
    texts.push(...plan.highlights);
  }
  
  // From features (legacy)
  if (plan.features) {
    texts.push(...plan.features);
  }
  
  // From detailed_features
  if (plan.detailed_features) {
    texts.push(...plan.detailed_features);
  }
  
  // From description
  if (plan.description) {
    texts.push(plan.description);
  }
  
  // From tagline
  if (plan.tagline) {
    texts.push(plan.tagline);
  }
  
  return texts.filter(t => t && t.trim().length > 0);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract dimension value from text using regex patterns
 */
function extractDimensionValue(
  texts: string[],
  patterns: RegExp[],
  transform?: (match: RegExpMatchArray) => string
): string | null {
  const allText = texts.join(' ').toLowerCase();
  
  for (const pattern of patterns) {
    const match = allText.match(pattern);
    if (match) {
      if (transform) {
        return transform(match);
      }
      // Return the matched text, cleaned up
      let result = match[0];
      // Try to extract a meaningful snippet
      const start = Math.max(0, match.index! - 10);
      const end = Math.min(allText.length, match.index! + match[0].length + 30);
      result = allText.substring(start, end).trim();
      // Clean up
      result = result.replace(/^\W+|\W+$/g, '');
      if (result.length > 50) {
        result = result.substring(0, 47) + '...';
      }
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  }
  
  return null;
}

/**
 * Extract a specific dimension from plan texts
 */
function extractDimension(
  planId: string,
  texts: string[],
  dimensionKey: string
): string | null {
  const allText = texts.join(' ').toLowerCase();
  
  switch (dimensionKey) {
    case 'watermark':
      if (allText.match(/\b(no\s+watermark|watermark\s+removal|without\s+watermark|watermark-free)\b/i)) {
        return 'No';
      }
      if (allText.match(/\b(watermark|watermarked|visible\s+watermark)\b/i)) {
        return 'Yes';
      }
      return null;
      
    case 'export_quality':
      if (allText.match(/\b(4k|2160p|4\s*k|ultra\s*hd)\b/i)) {
        return '4K';
      }
      if (allText.match(/\b(1080p|full\s*hd|fhd)\b/i)) {
        return '1080p';
      }
      if (allText.match(/\b(720p|hd)\b/i)) {
        return '720p';
      }
      return null;
      
    case 'minutes':
      // Match "x video mins" or "x minutes" (quota)
      const minutesMatch = allText.match(/\b(\d+)\s*(video\s+)?(mins?|minutes?|min)\b/i);
      if (minutesMatch) {
        return `${minutesMatch[1]} ${minutesMatch[3] || 'mins'}`;
      }
      const secsMatch = allText.match(/\b(\d+)\s*(secs?|seconds?)\b/i);
      if (secsMatch) {
        const secs = parseInt(secsMatch[1]);
        if (secs >= 60) {
          return `${Math.round(secs / 60)} mins`;
        }
        return `${secs} secs`;
      }
      return null;
      
    case 'max_duration':
      // Match "up to x mins" or "videos up to x-min" or "no video duration max"
      if (allText.match(/\bno\s+(video\s+)?duration\s+max\b/i)) {
        return 'No max';
      }
      const maxDurMatch = allText.match(/\b(up\s+to|videos?\s+up\s+to)\s+(\d+)[-\s]?(mins?|minutes?|min)\b/i);
      if (maxDurMatch) {
        return `Up to ${maxDurMatch[2]} mins`;
      }
      // Match "x-min videos" or "x minute videos"
      const durMatch = allText.match(/\b(\d+)[-\s]?(mins?|minutes?|min)\s*videos?\b/i);
      if (durMatch) {
        return `Up to ${durMatch[1]} mins`;
      }
      return null;
      
    case 'quota_videos':
      // Match "x videos per month" or "x videos/month"
      const videosPerMonthMatch = allText.match(/\b(\d+)\s*videos?\s*(per\s+month|\/mo|\/month)\b/i);
      if (videosPerMonthMatch) {
        return `${videosPerMonthMatch[1]} videos/month`;
      }
      // Match "unlimited videos"
      if (allText.match(/\bunlimited\s+videos?\b/i)) {
        return 'Unlimited';
      }
      return null;
      
    case 'languages':
      // Match "x+ languages" or "x languages"
      const langMatch = allText.match(/\b(\d+)\+?\s*(languages?|dialects?|langs?)\b/i);
      if (langMatch) {
        return `${langMatch[1]}+ languages`;
      }
      return null;
      
    case 'voices':
      // Match "x voices" or "x+ voices" or "xx voice options"
      const voicesMatch = allText.match(/\b(\d+)\+?\s*(voices?|voice\s+options?)\b/i);
      if (voicesMatch) {
        return `${voicesMatch[1]}+ voices`;
      }
      return null;
      
    case 'scene_limits':
      // Match "x scenes" or "x scene limits" or "unlimited scenes"
      if (allText.match(/\bunlimited\s+scenes?\b/i)) {
        return 'Unlimited';
      }
      const scenesMatch = allText.match(/\b(\d+)\s*(scenes?|scene\s+limits?)\b/i);
      if (scenesMatch) {
        return `${scenesMatch[1]} scenes`;
      }
      return null;
      
    case 'support':
      // Match support types: email/live chat/priority/dedicated manager
      const supportTypes: string[] = [];
      if (allText.match(/\bemail\s+support\b/i)) {
        supportTypes.push('Email');
      }
      if (allText.match(/\b(live\s+chat|chat\s+support)\b/i)) {
        supportTypes.push('Live chat');
      }
      if (allText.match(/\bpriority\s+support\b/i)) {
        supportTypes.push('Priority');
      }
      if (allText.match(/\b(dedicated\s+manager|customer\s+success\s+manager)\b/i)) {
        supportTypes.push('Dedicated manager');
      }
      if (supportTypes.length > 0) {
        return supportTypes.join(', ');
      }
      return null;
      
    case 'teams_security': {
      // Match teams/security features: seats/users/SSO/SAML/SCIM/MFA
      const teamFeatures: string[] = [];
      const teamSeatsMatch = allText.match(/\b(\d+)\s*(seats?|users?|team\s+members?)\b/i);
      if (teamSeatsMatch) {
        teamFeatures.push(`${teamSeatsMatch[1]} ${teamSeatsMatch[2] || 'users'}`);
      }
      if (allText.match(/\b(sso|saml|scim|mfa|multi[- ]factor)\b/i)) {
        teamFeatures.push('SSO/SAML');
      }
      if (teamFeatures.length > 0) {
        return teamFeatures.join(', ');
      }
      // Check for boolean presence
      if (allText.match(/\b(team\s+collaboration|workspace|enterprise[- ]grade\s+security)\b/i)) {
        return 'Included';
      }
      return null;
    }
      
    case 'voice_cloning':
      // Match "voice cloning" or "voice clone"
      if (allText.match(/\bvoice\s+(cloning|clone)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'sso_saml':
      // Match "SAML/SSO" or "SSO" or "SAML" or "SCIM"
      if (allText.match(/\b(saml\/sso|sso|saml|scim)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'scorm_lms':
      // Match "SCORM Export" or "LMS Integrations"
      const scormMatch = allText.match(/\bscorm\s+(export|integration)\b/i);
      const lmsMatch = allText.match(/\blms\s+integrations?\b/i);
      if (scormMatch || lmsMatch) {
        return 'Included';
      }
      return null;
      
    case 'integrations':
      // Match integrations with specific tools
      const integrationMatch = allText.match(/\bintegrations?\s+(with|for)\s+([^.]*)/i);
      if (integrationMatch) {
        const tools = integrationMatch[2].toLowerCase();
        const toolList: string[] = [];
        if (tools.includes('n8n')) toolList.push('n8n');
        if (tools.includes('make')) toolList.push('Make');
        if (tools.includes('hubspot')) toolList.push('HubSpot');
        if (tools.includes('zapier')) toolList.push('Zapier');
        if (toolList.length > 0) {
          return toolList.join(', ');
        }
        return 'Yes';
      }
      return null;
      
    case 'workspace_collab':
      // Match workspace collaboration features
      if (allText.match(/\b(workspace\s+collaboration|team\s+collaboration|video\s+draft\s+commenting|team\s+members?|invites?\s+&\s+team\s+management)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'security_features':
      // Match security features (SCIM, MFA, Enterprise-grade security)
      if (allText.match(/\b(scim|mfa|multi[- ]factor\s+authentication|enterprise[- ]grade\s+security|security\s+features?)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'credits':
      const creditsMatch = allText.match(/\b(\d+)\s*(credits?|credit|ai\s+credits?)\b/i);
      if (creditsMatch) {
        let result = `${creditsMatch[1]} Credits`;
        // Check for boost
        if (allText.includes('boost')) {
          const boostMatch = allText.match(/\b(\d+)x\s*boost/i);
          if (boostMatch) {
            result += ` (${boostMatch[1]}x Boost)`;
          } else {
            result += ' (includes Boost)';
          }
        }
        return result;
      }
      // Check for quota
      const quotaMatch = allText.match(/\b(\d+)\s*(quota|generations?|videos?)\s*(per\s+month|\/mo)?\b/i);
      if (quotaMatch) {
        return `${quotaMatch[1]} ${quotaMatch[2] || 'quota'}`;
      }
      return null;
      
    case 'seats':
      // Match seats/users/team members, including "$20/seat" patterns
      const seatsMatch = allText.match(/\b(\d+)\s*(seats?|users?|members?|team\s+members?)\b/i);
      const seatPriceMatch = allText.match(/\$(\d+)\/seat/i);
      if (seatsMatch) {
        let result = `${seatsMatch[1]} ${seatsMatch[2] || 'users'}`;
        if (seatPriceMatch) {
          result += ` ($${seatPriceMatch[1]}/seat)`;
        }
        return result;
      }
      // Match "additional seats" or "/seat" patterns
      if (allText.match(/\badditional\s+seats?\b/i) || allText.match(/\$(\d+)\/seat/i)) {
        const priceMatch = allText.match(/\$(\d+)\/seat/i);
        return priceMatch ? `$${priceMatch[1]}/seat` : 'Additional seats';
      }
      return null;
      
    case 'storage':
      const storageMatch = allText.match(/\b(\d+)\s*(gb|tb|gigabytes?|terabytes?)\s*(storage)?\b/i);
      if (storageMatch) {
        const amount = parseInt(storageMatch[1]);
        const unit = storageMatch[2].toLowerCase();
        if (unit.startsWith('tb')) {
          return `${amount}TB storage`;
        } else {
          return `${amount}GB storage`;
        }
      }
      return null;
      
    case 'seats_storage':
      // Combined seats and storage (for backward compatibility)
      const seatsMatchCombined = allText.match(/\b(\d+)\s*(seats?|users?|members?|team\s+members?)\b/i);
      const storageMatchCombined = allText.match(/\b(\d+)\s*(gb|tb|gigabytes?|terabytes?)\s*(storage)?\b/i);
      
      const partsCombined: string[] = [];
      if (seatsMatchCombined) {
        partsCombined.push(`${seatsMatchCombined[1]} ${seatsMatchCombined[2] || 'users'}`);
      }
      if (storageMatchCombined) {
        const amount = parseInt(storageMatchCombined[1]);
        const unit = storageMatchCombined[2].toLowerCase();
        if (unit.startsWith('tb')) {
          partsCombined.push(`${amount}TB storage`);
        } else {
          partsCombined.push(`${amount}GB storage`);
        }
      }
      
      if (partsCombined.length > 0) {
        return partsCombined.join(', ');
      }
      return null;
      
    case 'exports':
      if (allText.match(/\bunlimited\s+exports?\b/i)) {
        return 'Unlimited';
      }
      const exportsMatch = allText.match(/\b(\d+)\s*exports?\s*(per\s+(week|month))?\b/i);
      if (exportsMatch) {
        return `${exportsMatch[1]} exports${exportsMatch[3] ? `/${exportsMatch[3]}` : ''}`;
      }
      return null;
      
    case 'stock_assets':
      // Match iStock, Storyblocks, Shutterstock, stock avatars, stock footage, UGC ads
      const istockMatch = allText.match(/\b(\d+)\s*(istock|stock)\b/i);
      const storyblocksMatch = allText.match(/\bstoryblocks\b/i);
      const shutterstockMatch = allText.match(/\bshutterstock\b/i);
      const stockFootageMatch = allText.match(/\bstock\s+footage\b/i);
      const assetsMatch = allText.match(/\b(\d+)\s*(ugc\s+)?(product\s+asset\s+)?ads?\b/i);
      
      const stockParts: string[] = [];
      if (istockMatch) {
        stockParts.push(`${istockMatch[1]} iStock`);
      }
      if (storyblocksMatch) {
        stockParts.push('Storyblocks');
      }
      if (shutterstockMatch) {
        stockParts.push('Shutterstock');
      }
      if (stockFootageMatch) {
        stockParts.push('Stock footage');
      }
      if (assetsMatch) {
        stockParts.push(`${assetsMatch[1]} UGC ads`);
      }
      
      if (stockParts.length > 0) {
        return stockParts.join(' + ');
      }
      // Check for boolean presence
      if (allText.match(/\b(stock\s+(assets?|footage|avatars?)|istock|storyblocks|shutterstock)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'avatars_clones':
      // Match custom avatars, stock avatars, express clones, avatar IV
      const customAvatarMatch = allText.match(/\b(\d+)\s*custom\s+(video\s+)?avatars?\b/i);
      const stockAvatarMatch = allText.match(/\b(\d+)\+\s*stock\s+(video\s+)?avatars?\b/i);
      const clonesMatch = allText.match(/\b(\d+)\s*(express\s+)?clones?\b/i);
      const avatarsMatch = allText.match(/\b(\d+)\s*(express\s+)?avatars?\b/i);
      const avatarIVMatch = allText.match(/\bavatar\s+iv\b/i);
      
      const avatarParts: string[] = [];
      if (customAvatarMatch) {
        avatarParts.push(`${customAvatarMatch[1]} custom avatars`);
      }
      if (stockAvatarMatch) {
        avatarParts.push(`${stockAvatarMatch[1]}+ stock avatars`);
      }
      if (clonesMatch) {
        avatarParts.push(`${clonesMatch[1]} express clones`);
      }
      if (avatarsMatch && !customAvatarMatch && !stockAvatarMatch) {
        avatarParts.push(`${avatarsMatch[1]} avatars`);
      }
      if (avatarIVMatch && avatarParts.length === 0) {
        avatarParts.push('Avatar IV');
      }
      
      if (avatarParts.length > 0) {
        return avatarParts.join(', ');
      }
      // Check for boolean presence (ability-based)
      if (allText.match(/\b(custom\s+avatar|avatar\s+cloning|voice\s+cloning|avatar\s+iv)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'generative_video':
      // Match generative usage, seconds/minutes of generative video, generative ads
      const genSecsMatch = allText.match(/\b(\d+)\s*(secs?|seconds?)\s*(of\s+)?generative\s+video\b/i);
      const genMinsMatch = allText.match(/\b(\d+)\s*(mins?|minutes?)\s*(of\s+)?generative\s+(videos?|video)\b/i);
      const genUsageMatch = allText.match(/\b(\d+)x\s*(more\s+)?generative\s+usage\b/i);
      const genAdsMatch = allText.match(/\bgenerative\s+(ads?|advertising)\b/i);
      
      if (genMinsMatch) {
        return `${genMinsMatch[1]} mins`;
      }
      if (genSecsMatch) {
        const secs = parseInt(genSecsMatch[1]);
        if (secs >= 60) {
          return `${Math.round(secs / 60)} mins`;
        }
        return `${genSecsMatch[1]} secs`;
      }
      if (genUsageMatch) {
        return `${genUsageMatch[1]}x usage`;
      }
      if (genAdsMatch) {
        return 'Included';
      }
      // Check for boolean presence
      if (allText.match(/\b(generative\s+video|generative\s+ads?|extended\s+video\s+generation)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'processing_speed':
      // Match processing speed indicators
      if (allText.match(/\bfastest\s+(video\s+)?processing\b/i)) {
        return 'Fastest';
      }
      if (allText.match(/\bfaster\s+(video\s+)?processing\b/i)) {
        return 'Faster';
      }
      if (allText.match(/\bfast\s+(video\s+)?processing\b/i)) {
        return 'Fast';
      }
      if (allText.match(/\bstandard\s+(video\s+)?processing\b/i)) {
        return 'Standard';
      }
      return null;
      
    case 'branding':
      // Match branding features: brand kit, custom branding, white label
      if (allText.match(/\b(brand\s+kit|custom\s+branding|white\s+label|remove\s+branding)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'api_access':
      // Match API access
      if (allText.match(/\b(api\s+access|api\s+integration|rest\s+api)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'ai_images':
      // Match AI image generation features
      if (allText.match(/\b(ai\s+images?|image\s+generation|ai\s+generated\s+images?)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'media_library':
      // Match media library features
      if (allText.match(/\b(media\s+library|stock\s+library|asset\s+library|media\s+assets?)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'billing':
      // Match billing features: annual billing, invoice billing, centralized billing
      if (allText.match(/\b(invoice\s+billing|annual\s+billing|centralized\s+billing)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'subtitles':
      // Match subtitles features: auto subtitles, hr/mo, subtitle generation
      if (allText.match(/\bauto\s+subtitles?\b/i)) {
        // Try to extract hours per month
        const hoursMatch = allText.match(/\b(\d+)\s*(hr|hours?)\s*(per\s+month|\/mo)\b/i);
        if (hoursMatch) {
          return `${hoursMatch[1]} hr/mo`;
        }
        return 'Included';
      }
      if (allText.match(/\bsubtitle\s+generation\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'tts':
      // Match text-to-speech features
      if (allText.match(/\b(text[- ]to[- ]speech|tts|voiceover)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'upload_limit':
      // Match upload limits: file size, upload size, max file size
      const uploadMatch = allText.match(/\b(max\s+)?(upload|file)\s+size[:\s]+(\d+)\s*(mb|gb|tb)\b/i);
      if (uploadMatch) {
        return `${uploadMatch[3]} ${uploadMatch[4].toUpperCase()}`;
      }
      return null;
      
    case 'ai_generation':
      // Match AI generation features: Gen-AI Studio, video generation per day, generative usage
      if (allText.match(/\bgen[- ]?ai\s+studio\b/i)) {
        // Try to extract daily limits
        const dailyMatch = allText.match(/\b(\d+)\s*(videos?|generations?)\s*per\s+day\b/i);
        if (dailyMatch) {
          return `${dailyMatch[1]} per day`;
        }
        return 'Included';
      }
      if (allText.match(/\b(generative\s+usage|ai\s+generation|video\s+generation)\b/i)) {
        return 'Included';
      }
      return null;
      
    case 'templates':
      // Match templates features: templates, brand kit, fonts
      if (allText.match(/\b(templates?|template\s+library)\b/i)) {
        return 'Included';
      }
      if (allText.match(/\b(brand\s+kit|custom\s+fonts?)\b/i)) {
        return 'Brand kit';
      }
      return null;
      
    case 'included_paid':
      // Only for paid plans - common features like "Image generations 365 UNLIMITED"
      // This dimension should only be extracted if the feature appears with the badge
      const includedParts: string[] = [];
      
      // Check for Image generations with 365 UNLIMITED badge
      if (allText.match(/\bimage\s+generations?\b/i) && allText.match(/\b365\s+unlimited\b/i)) {
        includedParts.push('Image generations');
      }
      
      // Check for Nano Banana Pro with 365 UNLIMITED badge
      if (allText.match(/\bnano\s+banana\s+pro\b/i) && allText.match(/\b365\s+unlimited\b/i)) {
        includedParts.push('Nano Banana Pro');
      }
      
      if (includedParts.length > 0) {
        return `${includedParts.join(', ')} (365 UNLIMITED)`;
      }
      
      return null;
      
    default:
      return null;
  }
}

/**
 * Get price display text for a plan
 */
/**
 * Normalize plan price display - handles Contact Sales, Free, and Paid plans correctly
 */
/**
 * Normalize plan price display - STRONG RULES to prevent Enterprise from becoming Free
 * Priority: Contact Sales > Free > Paid > Fallback
 */
function normalizePlanPrice(plan: PricingPlan, billing: 'monthly' | 'yearly'): string {
  const planName = (plan.name || '').toLowerCase();
  const ctaText = (plan.ctaText || '').toLowerCase();
  const unitPriceNote = (plan.unitPriceNote || '').toLowerCase();
  
  // Collect all text fields to check for contact sales indicators
  const allPlanText = [
    plan.description || '',
    plan.tagline || '',
    ...(plan.features || []),
    ...(plan.highlights || []),
    ...(plan.featureItems?.map(f => f.text) || []),
    ctaText,
    unitPriceNote
  ].join(' ').toLowerCase();
  
  // ========== STEP 1: Contact Sales (HIGHEST PRIORITY) ==========
  // Even if price is missing or 0, if it's Enterprise/Contact Sales, return "Contact sales"
  const isContactSales = 
    planName.includes('enterprise') ||
    planName.includes('custom') ||
    planName.includes('contact') ||
    ctaText.includes('contact sales') ||
    ctaText.includes('talk to sales') ||
    ctaText.includes('request a demo') ||
    ctaText.includes('get a quote') ||
    allPlanText.includes('contact sales') ||
    allPlanText.includes('invoice billing') ||
    allPlanText.includes('custom pricing') ||
    unitPriceNote.includes('custom') ||
    unitPriceNote.includes('enterprise pricing') ||
    unitPriceNote.includes('contact sales');
  
  if (isContactSales) {
    return 'Contact sales';
  }
  
  // ========== STEP 2: Free (STRICT CONDITIONS ONLY) ==========
  // Only return Free if name explicitly contains "free" OR price explicitly says "Free"
  const isExplicitlyFree = 
    planName === 'free' ||
    (plan.price && typeof plan.price === 'string' && plan.price.toLowerCase().includes('free')) ||
    (plan.price && typeof plan.price === 'object' && 'monthly' in plan.price &&
     typeof plan.price.monthly === 'string' && plan.price.monthly.toLowerCase().includes('free'));
  
  if (isExplicitlyFree) {
    return 'Free';
  }
  
  // Check if price is 0 AND name suggests free (not Enterprise)
  if (plan.price && typeof plan.price === 'object' && 'monthly' in plan.price) {
    const monthly = plan.price.monthly;
    if (typeof monthly === 'object' && monthly.amount === 0) {
      // Only return Free if name also explicitly contains "free"
      if (planName.includes('free')) {
        return 'Free';
      }
      // If amount is 0 but name doesn't suggest free, it might be Enterprise (already handled above)
      // or it's a missing price - don't default to Free
    }
  }
  
  // ========== STEP 3: Paid Price ==========
  // Extract and format paid price
  if (plan.price) {
    if (typeof plan.price === 'string') {
      // If it's a string and not "Free", return as-is
      if (!plan.price.toLowerCase().includes('free')) {
        return plan.price;
      }
    }
    
    if (typeof plan.price === 'object') {
      if ('monthly' in plan.price && 'yearly' in plan.price) {
        const priceObj = billing === 'yearly' ? plan.price.yearly : plan.price.monthly;
        if (typeof priceObj === 'object') {
          const amount = priceObj.amount;
          if (amount > 0) {
            return `$${amount}/mo${billing === 'yearly' ? ' (yearly)' : ''}`;
          }
        }
      }
      
      if ('monthly' in plan.price) {
        const monthly = plan.price.monthly;
        if (typeof monthly === 'object') {
          const amount = monthly.amount;
          if (amount > 0) {
            return `$${amount}/mo`;
          }
        }
        if (typeof monthly === 'string' && !monthly.toLowerCase().includes('free')) {
          return monthly;
        }
      }
    }
  }
  
  // ========== STEP 4: Fallback ==========
  // If no price but name suggests paid plan (Creator/Pro/Business), return "Paid"
  if (planName && !planName.includes('free') && !planName.includes('enterprise')) {
    return 'Paid';
  }
  
  return '—';
}

/**
 * Derive watermark status from plan text and tool context
 * STRICT RULES: Enterprise should not default to Yes
 */
export function deriveWatermarkStatus(
  plan: PricingPlan,
  toolKeyFacts?: string[]
): string {
  const planName = (plan.name || '').toLowerCase();
  const isEnterprise = planName.includes('enterprise') || planName.includes('custom');
  
  // Collect all text from plan
  const allText = collectPlanText(plan).join(' ').toLowerCase();
  
  // ========== Priority 1: Explicit mentions in plan text (HIGHEST) ==========
  // Check for explicit "no watermark" indicators
  if (allText.match(/\b(watermark\s+removal|remove\s+watermark|no\s+watermarks?|without\s+watermark|watermark-free)\b/i)) {
    return 'No';
  }
  // Check for explicit "watermark" indicators
  if (allText.match(/\b(watermarked|includes\s+watermark|with\s+watermark|visible\s+watermark)\b/i)) {
    return 'Yes';
  }
  
  // ========== Priority 2: Use tool key_facts for inference (ONLY if explicitly stated) ==========
  if (toolKeyFacts && toolKeyFacts.length > 0) {
    const keyFactsText = toolKeyFacts.join(' ').toLowerCase();
    
    // Pattern: "Free plan outputs include watermark; paid plans support..." or similar
    const hasWatermarkPattern = 
      keyFactsText.match(/\bfree\s+plan.*watermark.*paid\s+plans/i) ||
      keyFactsText.match(/\bwatermark.*free.*paid.*no\s+watermark/i) ||
      keyFactsText.match(/\bfree.*watermark.*paid.*(1080p|4k|no\s+watermark)/i);
    
    if (hasWatermarkPattern) {
      // Check if this plan is Free
      const isFree = planName === 'free' || 
                     (plan.price && typeof plan.price === 'object' && 'monthly' in plan.price &&
                      typeof plan.price.monthly === 'object' && plan.price.monthly.amount === 0 &&
                      !isEnterprise); // Don't treat Enterprise with 0 amount as Free
      
      if (isFree) {
        return 'Yes';
      } else if (!isEnterprise) {
        // For paid plans (not Enterprise), infer No
        return 'No';
      }
      // For Enterprise: don't infer, fall through to "See plan details"
    }
  }
  
  // ========== Priority 3: Fallback ==========
  // Enterprise: Never default to Yes, use "See plan details"
  if (isEnterprise) {
    return 'See plan details';
  }
  
  // For other plans without explicit info, use "See plan details" instead of "—"
  return 'See plan details';
}

/**
 * Extract comparable attributes from plans
 */
export function extractComparableAttributes(
  plans: PricingPlan[],
  billing: 'monthly' | 'yearly' = 'monthly',
  toolKeyFacts?: string[]
): ComparableAttribute[] {
  // Dimension definitions with labels and keys
  const dimensionDefs: Array<{ key: string; label: string; decisionWeight: number }> = [
    { key: 'price', label: 'Price', decisionWeight: 10 },
    { key: 'watermark', label: 'Watermark', decisionWeight: 8 },
    { key: 'export_quality', label: 'Export quality', decisionWeight: 8 },
    { key: 'max_duration', label: 'Max duration', decisionWeight: 8 },
    { key: 'quota_videos', label: 'Videos per month', decisionWeight: 7 },
    { key: 'minutes', label: 'Video minutes', decisionWeight: 7 },
    { key: 'languages', label: 'Languages', decisionWeight: 6 },
    { key: 'credits', label: 'Credits', decisionWeight: 8 },
    { key: 'seats', label: 'Seats', decisionWeight: 6 },
    { key: 'storage', label: 'Storage', decisionWeight: 5 },
    { key: 'seats_storage', label: 'Seats / Storage', decisionWeight: 6 },
    { key: 'exports', label: 'Exports', decisionWeight: 7 },
    { key: 'voice_cloning', label: 'Voice cloning', decisionWeight: 6 },
    { key: 'sso_saml', label: 'SSO / SAML', decisionWeight: 5 },
    { key: 'scorm_lms', label: 'SCORM / LMS', decisionWeight: 5 },
    { key: 'integrations', label: 'Integrations', decisionWeight: 4 },
    { key: 'workspace_collab', label: 'Workspace collaboration', decisionWeight: 5 },
    { key: 'security_features', label: 'Security features', decisionWeight: 5 },
    { key: 'stock_assets', label: 'Stock / Assets', decisionWeight: 4 },
    { key: 'avatars_clones', label: 'Avatars / Clones', decisionWeight: 4 },
    { key: 'generative_video', label: 'Generative video', decisionWeight: 5 },
    { key: 'processing_speed', label: 'Processing speed', decisionWeight: 4 },
    { key: 'voices', label: 'Voices', decisionWeight: 5 },
    { key: 'scene_limits', label: 'Scene limits', decisionWeight: 5 },
    { key: 'support', label: 'Support', decisionWeight: 4 },
    { key: 'teams_security', label: 'Teams / Security', decisionWeight: 5 },
    { key: 'branding', label: 'Branding', decisionWeight: 3 },
    { key: 'api_access', label: 'API access', decisionWeight: 4 },
    { key: 'ai_images', label: 'AI images', decisionWeight: 3 },
    { key: 'media_library', label: 'Media library', decisionWeight: 3 },
    { key: 'billing', label: 'Billing', decisionWeight: 3 },
    { key: 'subtitles', label: 'Subtitles', decisionWeight: 5 },
    { key: 'tts', label: 'Text-to-speech', decisionWeight: 4 },
    { key: 'upload_limit', label: 'Upload limit', decisionWeight: 4 },
    { key: 'ai_generation', label: 'AI generation', decisionWeight: 5 },
    { key: 'templates', label: 'Templates / Brand kit', decisionWeight: 3 },
    { key: 'included_paid', label: 'Included (paid)', decisionWeight: 3 },
  ];
  
  // Create plan ID map
  const planIdMap = new Map<PricingPlan, string>();
  plans.forEach((plan, idx) => {
    planIdMap.set(plan, plan.name || `plan-${idx}`);
  });
  
  // Extract values for each dimension
  const attributes: ComparableAttribute[] = [];
  
  for (const dim of dimensionDefs) {
    const valuesByPlanId: Record<string, string> = {};
    
    for (const plan of plans) {
      const planId = planIdMap.get(plan)!;
      
      if (dim.key === 'price') {
        valuesByPlanId[planId] = normalizePlanPrice(plan, billing);
      } else if (dim.key === 'watermark') {
        valuesByPlanId[planId] = deriveWatermarkStatus(plan, toolKeyFacts);
      } else {
        const texts = collectPlanText(plan);
        const value = extractDimension(planId, texts, dim.key);
        valuesByPlanId[planId] = value || '';
      }
    }
    
    // Calculate coverage (how many plans have non-empty values)
    const coverage = Object.values(valuesByPlanId).filter(v => v && v !== '').length;
    
    // Calculate variance (how many unique values)
    const uniqueValues = new Set(Object.values(valuesByPlanId).filter(v => v && v !== ''));
    const variance = uniqueValues.size;
    
    attributes.push({
      key: dim.key,
      label: dim.label,
      valuesByPlanId,
      coverage,
      variance,
    });
  }
  
  return attributes;
}

/**
 * Score and select attributes for display
 * Ensures at least 8-12 rows for better information density
 * @param aggressiveMode - If true, use more relaxed rules to ensure minRows (for tools other than invideo/heygen)
 */
export function selectAttributesForDisplay(
  attributes: ComparableAttribute[],
  minRows: number = 8,
  maxRows: number = 12,
  aggressiveMode: boolean = false
): ComparableAttribute[] {
  // Always include price
  const priceAttr = attributes.find(a => a.key === 'price');
  const otherAttrs = attributes.filter(a => a.key !== 'price');
  
  // Decision weights (from dimensionDefs)
  const decisionWeights: Record<string, number> = {
    watermark: 8,
    export_quality: 8,
    max_duration: 8,
    quota_videos: 7,
    minutes: 7,
    languages: 6,
    credits: 8,
    seats: 6,
    storage: 5,
    seats_storage: 6,
    exports: 7,
    voice_cloning: 6,
    sso_saml: 5,
    scorm_lms: 5,
    integrations: 4,
    workspace_collab: 5,
    security_features: 5,
    stock_assets: 4,
    avatars_clones: 4,
    generative_video: 5,
    processing_speed: 4,
    voices: 5,
    scene_limits: 5,
    support: 4,
    teams_security: 5,
    branding: 3,
    api_access: 4,
    ai_images: 3,
    media_library: 3,
    billing: 3,
    subtitles: 5,
    tts: 4,
    upload_limit: 4,
    ai_generation: 5,
    templates: 3,
    included_paid: 3,
  };
  
  // Normalize function for comparing values
  const normalize = (value: string): string => {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  };
  
  // Score each attribute
  const scored = otherAttrs.map(attr => {
    const decisionWeight = decisionWeights[attr.key] || 1;
    const totalPlans: number = Object.keys(attr.valuesByPlanId).length;
    
    // Coverage: how many plans have a value
    const coverage = attr.coverage / totalPlans;
    
    // Variance: how many distinct values (normalized, excluding empty/fallback)
    const distinctValues = new Set(
      Object.values(attr.valuesByPlanId)
        .filter(v => v && v !== '' && v !== '—' && v !== 'See plan details')
        .map(normalize)
    );
    const distinct = distinctValues.size;
    
    // Information score: coverage * distinct (higher is better)
    const infoScore = coverage * distinct;
    
    // Total score: priority first, then info score
    const totalScore = decisionWeight * 100 + infoScore * 10;
    
    return {
      ...attr,
      score: totalScore,
      coverage,
      distinct,
      infoScore,
    } as ComparableAttribute & { score: number; coverage: number; distinct: number; infoScore: number };
  });
  
  // Core decision dimensions (always include even if coverage is 0, to ensure they appear)
  const coreDecisionKeys = ['watermark', 'export_quality', 'max_duration'];
  let coreDecisionAttrs: Array<ComparableAttribute & { score: number; coverage: number; distinct: number; infoScore: number }> = 
    scored.filter(attr => coreDecisionKeys.includes(attr.key));
  
  // Ensure core decision attributes exist even if they have no coverage
  for (const key of coreDecisionKeys) {
    if (!coreDecisionAttrs.some(a => a.key === key)) {
      // Find the attribute from otherAttrs and score it
      const existingAttr = otherAttrs.find(a => a.key === key);
      if (existingAttr) {
        // Score it (even if coverage is 0)
        const decisionWeight = decisionWeights[existingAttr.key] || 1;
        const totalPlans: number = Object.keys(existingAttr.valuesByPlanId).length;
        const coverage = totalPlans > 0 ? existingAttr.coverage / totalPlans : 0;
        const distinctValues = new Set(
          Object.values(existingAttr.valuesByPlanId)
            .filter(v => v && v !== '' && v !== '—' && v !== 'See plan details')
            .map(normalize)
        );
        const distinct = distinctValues.size;
        const infoScore = coverage * distinct;
        const totalScore = decisionWeight * 100 + infoScore * 10;
        
        const scoredAttr: ComparableAttribute & { score: number; coverage: number; distinct: number; infoScore: number } = {
          ...existingAttr,
          score: totalScore,
          coverage,
          distinct,
          infoScore,
        };
        
        coreDecisionAttrs.push(scoredAttr);
      }
    }
  }
  
  // Round 1: Select attributes with good coverage and variance
  // In aggressive mode: use coverage >= 0.3 (30%) instead of 0.5 (50%)
  const coverageThreshold = aggressiveMode ? 0.3 : 0.5;
  const round1Filtered = scored.filter(attr => {
    // Core decision dimensions are already included
    if (coreDecisionKeys.includes(attr.key)) return false;
    
    // Good coverage and variance
    if (attr.coverage >= coverageThreshold && (attr as any).distinct >= 2) {
      return true;
    }
    
    return false;
  });
  
  // Round 2: Strong selling points (even with lower coverage)
  const strongSellingPoints = [
    'sso_saml', 'scorm_lms', 'integrations', 'workspace_collab', 
    'security_features', 'voice_cloning', 'avatars_clones', 
    'generative_video', 'stock_assets', 'languages', 'seats', 
    'processing_speed', 'voices', 'scene_limits', 'support', 
    'teams_security', 'api_access', 'branding', 'ai_images', 'media_library',
    'subtitles', 'tts', 'upload_limit', 'ai_generation', 'templates'
  ];
  const round2Filtered = scored.filter(attr => {
    // Skip if already included
    if (coreDecisionKeys.includes(attr.key)) return false;
    if (round1Filtered.some(a => a.key === attr.key)) return false;
    
    // Strong selling points: coverage >= 1 (at least one plan has it)
    if (strongSellingPoints.includes(attr.key) && attr.coverage >= 1) {
      return true;
    }
    
    return false;
  });
  
  // Combine Round 1 and Round 2
  const filtered = [...round1Filtered, ...round2Filtered];
  
  // Sort filtered by score descending
  filtered.sort((a, b) => (b as any).score - (a as any).score);
  
  // Combine core decision + filtered, then remove duplicates
  const combined = [...coreDecisionAttrs, ...filtered];
  const uniqueCombined = combined.filter((attr, idx, self) => 
    idx === self.findIndex(a => a.key === attr.key)
  );
  
  // Sort combined by priority (core decision first, then by score)
  uniqueCombined.sort((a, b) => {
    const aIsCore = coreDecisionKeys.includes(a.key);
    const bIsCore = coreDecisionKeys.includes(b.key);
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;
    return (b as any).score - (a as any).score;
  });
  
  // Fallback Round 3: if we still have less than minRows, relax further
  const currentCount = uniqueCombined.length;
  if (currentCount < minRows - 1) {
    // In aggressive mode: use even more relaxed rules
    const minNonEmptyCells = aggressiveMode ? 1 : 2;
    const minDecisionWeight = aggressiveMode ? 3 : 4;
    
    // Allow coverage >= 1 AND distinct >= 1, but must have at least N non-empty cells
    const relaxed = scored.filter(attr => {
      if (coreDecisionKeys.includes(attr.key)) return false; // Already included
      if (uniqueCombined.some(c => c.key === attr.key)) return false; // Already included
      
      // Count non-empty cells (excluding "—" and empty strings)
      const nonEmptyCount = Object.values(attr.valuesByPlanId).filter(v => 
        v && v !== '' && v !== '—' && v !== 'See plan details'
      ).length;
      
      // Relaxed rule: coverage >= 1, distinct >= 1, and at least N non-empty cells
      if (attr.coverage >= 1 && (attr as any).distinct >= 1 && nonEmptyCount >= minNonEmptyCells) {
        // Prefer attributes with higher decision weight
        const weight = decisionWeights[attr.key] || 1;
        return weight >= minDecisionWeight;
      }
      
      // In aggressive mode: also allow attributes with coverage >= 1 even if distinct is 0 (all same value)
      if (aggressiveMode && attr.coverage >= 1 && nonEmptyCount >= 1) {
        const weight = decisionWeights[attr.key] || 1;
        // Only for strong selling points or important dimensions
        if (weight >= 4 || strongSellingPoints.includes(attr.key)) {
          return true;
        }
      }
      
      return false;
    });
    
    // Dynamic fallback: Extract high-value sentences from plan text if still insufficient
    if (aggressiveMode && uniqueCombined.length + relaxed.length < minRows - 1) {
      // Get all plans from attributes (they all have the same plan set)
      const allPlans = attributes.length > 0 ? 
        Object.keys(attributes[0].valuesByPlanId).map(planId => {
          // Find plan by ID (we need to get plans from the extractComparableAttributes call)
          // This is a fallback, so we'll create synthetic attributes from text
          return null;
        }).filter(Boolean) : [];
      
      // This will be handled by the caller if needed - for now, just use relaxed rules
    }
    
    // Sort relaxed by decision weight and infoScore
    relaxed.sort((a, b) => {
      const weightA = decisionWeights[a.key] || 1;
      const weightB = decisionWeights[b.key] || 1;
      if (weightA !== weightB) return weightB - weightA;
      return (b as any).infoScore - (a as any).infoScore;
    });
    
    // Merge with uniqueCombined, avoiding duplicates
    const existingKeys = new Set(uniqueCombined.map(a => a.key));
    const additional = relaxed.filter(a => !existingKeys.has(a.key));
    uniqueCombined.push(...additional);
    
    // Re-sort after adding relaxed attributes
    uniqueCombined.sort((a, b) => {
      const aIsCore = coreDecisionKeys.includes(a.key);
      const bIsCore = coreDecisionKeys.includes(b.key);
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;
      const priorityA = decisionWeights[a.key] || 1;
      const priorityB = decisionWeights[b.key] || 1;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return (b as any).infoScore - (a as any).infoScore;
    });
  }
  
  // Take top N (maxRows - 1 for price, but ensure at least minRows - 1)
  const targetRows = Math.max(minRows - 1, Math.min(maxRows - 1, uniqueCombined.length));
  const selected = uniqueCombined.slice(0, targetRows);
  
  // Combine: price first, then selected
  const result: ComparableAttribute[] = [];
  if (priceAttr) {
    result.push(priceAttr);
  }
  result.push(...selected);
  
  return result;
}
