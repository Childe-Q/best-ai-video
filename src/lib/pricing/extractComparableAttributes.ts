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

function isMeaningfulComparableValue(value: string | null | undefined): value is string {
  if (!value) return false;

  const normalized = value.toLowerCase().trim();
  return (
    normalized !== '' &&
    normalized !== '—' &&
    normalized !== 'see plan details' &&
    normalized !== 'paid'
  );
}

function joinComparableParts(parts: Array<string | null>): string | null {
  const uniqueParts = Array.from(
    new Set(parts.filter((part): part is string => isMeaningfulComparableValue(part)))
  );

  if (uniqueParts.length === 0) return null;
  return uniqueParts.join(' / ');
}

function extractFormalTableValue(
  plan: PricingPlan,
  texts: string[],
  rowKey: string,
  toolKeyFacts?: string[]
): string {
  switch (rowKey) {
    case 'price':
      return normalizePlanPrice(plan, 'monthly');

    case 'watermark':
      return deriveWatermarkStatus(plan, toolKeyFacts);

    case 'plan_allowance':
      return (
        extractDimension(plan.name, texts, 'quota_videos') ||
        extractDimension(plan.name, texts, 'minutes') ||
        extractDimension(plan.name, texts, 'credits') ||
        extractDimension(plan.name, texts, 'exports') ||
        ''
      );

    case 'voice_language':
      return (
        joinComparableParts([
          extractDimension(plan.name, texts, 'voices'),
          extractDimension(plan.name, texts, 'languages'),
        ]) || ''
      );

    case 'team_admin':
      return (
        joinComparableParts([
          extractDimension(plan.name, texts, 'seats'),
          extractDimension(plan.name, texts, 'workspace_collab'),
        ]) || ''
      );

    case 'security_admin':
      return (
        joinComparableParts([
          extractDimension(plan.name, texts, 'sso_saml'),
          extractDimension(plan.name, texts, 'security_features'),
        ]) || ''
      );

    case 'integrations_api':
      return (
        joinComparableParts([
          extractDimension(plan.name, texts, 'integrations'),
          extractDimension(plan.name, texts, 'api_access'),
          extractDimension(plan.name, texts, 'scorm_lms'),
        ]) || ''
      );

    default:
      return extractDimension(plan.name, texts, rowKey) || '';
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
  // Canonical pricing cards are the primary source now, so formal table rows
  // should map to stable buyer-facing questions instead of legacy comparison-table semantics.
  const dimensionDefs: Array<{ key: string; label: string; decisionWeight: number }> = [
    { key: 'price', label: 'Price', decisionWeight: 12 },
    { key: 'plan_allowance', label: 'Plan allowance', decisionWeight: 10 },
    { key: 'export_quality', label: 'Output quality', decisionWeight: 9 },
    { key: 'max_duration', label: 'Video length', decisionWeight: 9 },
    { key: 'watermark', label: 'Watermark', decisionWeight: 8 },
    { key: 'avatars_clones', label: 'Avatars / clones', decisionWeight: 8 },
    { key: 'voice_language', label: 'Voices / languages', decisionWeight: 7 },
    { key: 'voice_cloning', label: 'Voice cloning', decisionWeight: 7 },
    { key: 'team_admin', label: 'Seats / workspace', decisionWeight: 6 },
    { key: 'security_admin', label: 'Admin / security', decisionWeight: 6 },
    { key: 'integrations_api', label: 'Integrations / API', decisionWeight: 5 },
    { key: 'processing_speed', label: 'Processing speed', decisionWeight: 5 },
    { key: 'stock_assets', label: 'Stock / Assets', decisionWeight: 4 },
    { key: 'subtitles', label: 'Subtitles', decisionWeight: 5 },
    { key: 'templates', label: 'Templates / brand kit', decisionWeight: 4 },
    { key: 'support', label: 'Support', decisionWeight: 3 },
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
      const texts = collectPlanText(plan);
      const value =
        dim.key === 'price'
          ? normalizePlanPrice(plan, billing)
          : dim.key === 'watermark'
          ? deriveWatermarkStatus(plan, toolKeyFacts)
          : extractFormalTableValue(plan, texts, dim.key, toolKeyFacts);

      valuesByPlanId[planId] = value || '';
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
  const priceAttr = attributes.find(a => a.key === 'price');
  const normalize = (value: string): string => value.toLowerCase().trim().replace(/\s+/g, ' ');
  const otherAttrs = attributes.filter(a => a.key !== 'price');

  const priorityOrder = [
    'plan_allowance',
    'export_quality',
    'max_duration',
    'watermark',
    'avatars_clones',
    'voice_language',
    'voice_cloning',
    'team_admin',
    'security_admin',
    'integrations_api',
    'processing_speed',
    'stock_assets',
    'subtitles',
    'templates',
    'support',
  ];

  const fallbackOrder: string[] = [];

  const byKey = new Map(otherAttrs.map((attr) => [attr.key, attr]));

  const shouldRender = (attr: ComparableAttribute): boolean => {
    const values = Object.values(attr.valuesByPlanId);
    const meaningfulValues = values.filter((value) => isMeaningfulComparableValue(value));
    if (meaningfulValues.length < 2) {
      return aggressiveMode && meaningfulValues.length >= 1;
    }

    const distinctMeaningfulValues = new Set(meaningfulValues.map(normalize));
    const hasTieredCoverage = meaningfulValues.length < values.length;

    return distinctMeaningfulValues.size >= 2 || hasTieredCoverage;
  };

  const selected: ComparableAttribute[] = [];
  const selectedKeys = new Set<string>();

  const takeIfRenderable = (key: string) => {
    const attr = byKey.get(key);
    if (!attr || selectedKeys.has(key) || !shouldRender(attr)) return;
    selected.push(attr);
    selectedKeys.add(key);
  };

  priorityOrder.forEach(takeIfRenderable);

  if (selected.length < minRows - 1) {
    fallbackOrder.forEach(takeIfRenderable);
  }

  if (selected.length < minRows - 1) {
    otherAttrs
      .filter((attr) => !selectedKeys.has(attr.key))
      .filter(shouldRender)
      .sort((a, b) => {
        if (b.coverage !== a.coverage) return b.coverage - a.coverage;

        const aDistinct = new Set(
          Object.values(a.valuesByPlanId)
            .filter((value): value is string => isMeaningfulComparableValue(value))
            .map(normalize)
        ).size;
        const bDistinct = new Set(
          Object.values(b.valuesByPlanId)
            .filter((value): value is string => isMeaningfulComparableValue(value))
            .map(normalize)
        ).size;

        return bDistinct - aDistinct;
      })
      .forEach((attr) => {
        if (selected.length >= maxRows - 1) return;
        selected.push(attr);
        selectedKeys.add(attr.key);
      });
  }

  const result: ComparableAttribute[] = [];
  if (priceAttr) result.push(priceAttr);
  result.push(...selected.slice(0, maxRows - 1));
  return result;
}
