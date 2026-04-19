#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

type RawImportEntry = {
  valueCandidate?: string;
  snippet?: string;
  sourceUrl?: string;
  artifactType?: string;
  contentType?: string;
};

type RawImportFile = {
  generatedAt?: string;
  missingFields?: string[];
  fields?: {
    sourceUrls?: string[];
    policy?: Record<string, RawImportEntry[] | undefined>;
    mainLimitations?: RawImportEntry[];
    workflowFeatureDocs?: RawImportEntry[];
    securityApiEnterprise?: Record<string, RawImportEntry[] | undefined>;
  };
};

type SlugMapFile = {
  canonicalByImportSlug?: Record<string, string | null>;
};

type SafeWritebackItem = {
  value: string;
  sourceUrl: string;
};

const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, 'data', 'non-price-evidence-import', 'tools');
const EVIDENCE_DIR = path.join(ROOT, 'data', 'evidence');
const SLUG_MAP_PATH = path.join(ROOT, 'data', 'non-price-evidence-import', 'slug-map.json');

const ALLOWED_ARTIFACT_TYPES = new Set([
  'official_page_html',
  'runtime_capture_html',
  'runtime_capture_json',
  'official_page_json',
  'report',
  'remote_official_page',
]);

const NOISE_PATTERNS = [
  /academy/i,
  /changelog/i,
  /^pricing$/i,
  /^support$/i,
  /^docs$/i,
  /^faq$/i,
  /^blog$/i,
  /^about$/i,
  /^contact$/i,
  /^privacy policy$/i,
  /^security$/i,
  /^enterprise$/i,
  /^api$/i,
  /^learn more$/i,
  /^get started$/i,
  /^book demo$/i,
  /^start free$/i,
  /^sign in$/i,
  /^log in$/i,
  /^copyright/i,
  /^cancel$/i,
  /no credit card required/i,
  /enterprise sales/i,
  /trusted everyday/i,
  /join our global team/i,
  /working remotely/i,
  /save up to/i,
  /1 click/i,
  /under 1 minute/i,
  /schedule a month/i,
  /from zero to monetization/i,
  /software license management/i,
  /^data security$/i,
  /^workspace$/i,
  /^integrations$/i,
  /^export$/i,
  /^characters$/i,
  /^privacy & security$/i,
  /^what happens/i,
  /^how can i cancel/i,
  /^how do i cancel/i,
  /^do you offer enterprise plans/i,
  /for individuals and small teams/i,
  /for organizations that need tailored solutions/i,
  /never run out/i,
  /top-ups? available/i,
];

const FIELD_LIMITS = {
  policy: 4,
  mainLimitations: 4,
  workflowFeatureDocs: 6,
  security: 4,
  api: 4,
  enterprise: 4,
} as const;

function cleanText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[↗•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAllowedArtifact(entry: RawImportEntry): boolean {
  if (entry.contentType?.toLowerCase() === 'js') {
    return false;
  }

  if (!entry.artifactType) {
    return true;
  }

  return ALLOWED_ARTIFACT_TYPES.has(entry.artifactType);
}

function looksNoisy(text: string): boolean {
  if (!text) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isLikelyRootPage(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' || parsed.pathname === '';
  } catch {
    return false;
  }
}

function pickValue(entry: RawImportEntry): string {
  return cleanText(entry.valueCandidate || entry.snippet || '');
}

function shouldKeep(text: string, bucket: string, sourceUrl?: string): boolean {
  if (!text || text.length < 6 || looksNoisy(text)) {
    return false;
  }

  const lower = text.toLowerCase();
  const policyRightsPatterns = [
    /commercial/i,
    /license/i,
    /rights?/i,
    /attribution/i,
    /distribut/i,
    /ownership/i,
    /\bown\b/i,
    /use or distribute/i,
  ];

  switch (bucket) {
    case 'policy.watermark':
      return matchesAny(text, [/watermark/i]);
    case 'policy.commercialUse':
    case 'policy.usageRights':
      return matchesAny(text, policyRightsPatterns) && !matchesAny(text, [/calculator/i, /youtube channel/i, /faster/i]);
    case 'policy.refundCancellation':
      return matchesAny(text, [/cancel/i, /refund/i, /billing/i, /billing cycle/i, /paid upfront/i, /unused months?/i]);
    case 'policy.exportLimits':
      return text.length >= 10
        && !/^export$/i.test(text)
        && matchesAny(text, [/export/i, /download/i, /1080/i, /4k/i, /720p/i, /resolution/i, /scorm/i]);
    case 'mainLimitations':
      return matchesAny(text, [
        /limited/i,
        /limit/i,
        /max/i,
        /up to/i,
        /without/i,
        /no access/i,
        /watermark/i,
        /storage/i,
        /retention/i,
        /credits?/i,
        /minutes?/i,
        /duration/i,
        /users?/i,
        /seats?/i,
        /concurr/i,
        /plan/i,
        /trial/i,
        /free/i,
        /expires?/i,
      ]) && !matchesAny(text, [
        /premium features/i,
        /maximum access/i,
        /lets you/i,
        /generate/i,
        /expressive/i,
        /fully autonomous/i,
        /built on/i,
        /enough for/i,
      ]) && !isLikelyRootPage(sourceUrl);
    case 'workflowFeatureDocs':
      return !matchesAny(text, [/privacy/i, /terms/i]) && lower.length >= 8;
    case 'securityApiEnterprise.security':
      return text.length >= 12
        && !isLikelyRootPage(sourceUrl)
        && matchesAny(text, [/security/i, /privacy/i, /soc/i, /gdpr/i, /sso/i, /scim/i, /mfa/i, /audit/i, /compliance/i]);
    case 'securityApiEnterprise.api':
      return matchesAny(text, [/api/i, /integration/i, /zapier/i, /webhook/i, /developer/i, /streaming/i, /sdk/i])
        && !matchesAny(text, [/credits work like currency/i]);
    case 'securityApiEnterprise.enterprise':
      return text.length >= 12
        && matchesAny(text, [/enterprise/i, /team/i, /workspace/i, /admin/i, /collaboration/i, /brand kit/i, /permissions?/i, /organization/i])
        && !matchesAny(text, [/sales/i, /trusted everyday/i, /contact the sales team/i]);
    default:
      return true;
  }
}

function toSafeItems(entries: RawImportEntry[] | undefined, bucket: string, limit: number): SafeWritebackItem[] | undefined {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  const seen = new Set<string>();
  const items: SafeWritebackItem[] = [];

  for (const entry of entries) {
    if (!entry?.sourceUrl || !hasAllowedArtifact(entry)) {
      continue;
    }

    const value = pickValue(entry);
    if (!shouldKeep(value, bucket, entry.sourceUrl)) {
      continue;
    }

    const dedupeKey = `${value.toLowerCase()}|${entry.sourceUrl}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    items.push({
      value,
      sourceUrl: entry.sourceUrl,
    });

    if (items.length >= limit) {
      break;
    }
  }

  return items.length > 0 ? items : undefined;
}

function buildNonPriceEvidenceImport(importSlug: string, raw: RawImportFile) {
  const sourceUrls = Array.isArray(raw.fields?.sourceUrls) ? raw.fields?.sourceUrls.filter(Boolean) : [];
  const bundleDate = cleanText(raw.generatedAt).split('T')[0] || '';

  const policy = {
    ...(toSafeItems(raw.fields?.policy?.watermark, 'policy.watermark', FIELD_LIMITS.policy)
      ? { watermark: toSafeItems(raw.fields?.policy?.watermark, 'policy.watermark', FIELD_LIMITS.policy) }
      : {}),
    ...(toSafeItems(raw.fields?.policy?.commercialUse, 'policy.commercialUse', FIELD_LIMITS.policy)
      ? { commercialUse: toSafeItems(raw.fields?.policy?.commercialUse, 'policy.commercialUse', FIELD_LIMITS.policy) }
      : {}),
    ...(toSafeItems(raw.fields?.policy?.usageRights, 'policy.usageRights', FIELD_LIMITS.policy)
      ? { usageRights: toSafeItems(raw.fields?.policy?.usageRights, 'policy.usageRights', FIELD_LIMITS.policy) }
      : {}),
    ...(toSafeItems(raw.fields?.policy?.refundCancellation, 'policy.refundCancellation', FIELD_LIMITS.policy)
      ? { refundCancellation: toSafeItems(raw.fields?.policy?.refundCancellation, 'policy.refundCancellation', FIELD_LIMITS.policy) }
      : {}),
    ...(toSafeItems(raw.fields?.policy?.exportLimits, 'policy.exportLimits', FIELD_LIMITS.policy)
      ? { exportLimits: toSafeItems(raw.fields?.policy?.exportLimits, 'policy.exportLimits', FIELD_LIMITS.policy) }
      : {}),
  };

  const securityApiEnterprise = {
    ...(toSafeItems(raw.fields?.securityApiEnterprise?.security, 'securityApiEnterprise.security', FIELD_LIMITS.security)
      ? { security: toSafeItems(raw.fields?.securityApiEnterprise?.security, 'securityApiEnterprise.security', FIELD_LIMITS.security) }
      : {}),
    ...(toSafeItems(raw.fields?.securityApiEnterprise?.api, 'securityApiEnterprise.api', FIELD_LIMITS.api)
      ? { api: toSafeItems(raw.fields?.securityApiEnterprise?.api, 'securityApiEnterprise.api', FIELD_LIMITS.api) }
      : {}),
    ...(toSafeItems(raw.fields?.securityApiEnterprise?.enterprise, 'securityApiEnterprise.enterprise', FIELD_LIMITS.enterprise)
      ? { enterprise: toSafeItems(raw.fields?.securityApiEnterprise?.enterprise, 'securityApiEnterprise.enterprise', FIELD_LIMITS.enterprise) }
      : {}),
  };

  const safeWriteback = {
    ...(Object.keys(policy).length > 0 ? { policy } : {}),
    ...(toSafeItems(raw.fields?.mainLimitations, 'mainLimitations', FIELD_LIMITS.mainLimitations)
      ? { mainLimitations: toSafeItems(raw.fields?.mainLimitations, 'mainLimitations', FIELD_LIMITS.mainLimitations) }
      : {}),
    ...(toSafeItems(raw.fields?.workflowFeatureDocs, 'workflowFeatureDocs', FIELD_LIMITS.workflowFeatureDocs)
      ? { workflowFeatureDocs: toSafeItems(raw.fields?.workflowFeatureDocs, 'workflowFeatureDocs', FIELD_LIMITS.workflowFeatureDocs) }
      : {}),
    ...(Object.keys(securityApiEnterprise).length > 0 ? { securityApiEnterprise } : {}),
  };

  return {
    bundleDate,
    sourceBundle: path.posix.join('data', 'non-price-evidence-import', 'tools', `${importSlug}.json`),
    sourceUrls,
    safeWriteback,
    retainedUnresolved: Array.isArray(raw.missingFields) ? raw.missingFields : [],
  };
}

function main() {
  const slugMap = JSON.parse(fs.readFileSync(SLUG_MAP_PATH, 'utf-8')) as SlugMapFile;
  const canonicalByImportSlug = slugMap.canonicalByImportSlug || {};
  const importFiles = fs.readdirSync(IMPORT_DIR).filter((file) => file.endsWith('.json')).sort();
  const force = process.argv.includes('--force');
  const slugsArgIndex = process.argv.indexOf('--slugs');
  const requestedSlugs = new Set(
    slugsArgIndex >= 0 && process.argv[slugsArgIndex + 1]
      ? process.argv[slugsArgIndex + 1].split(',').map((value) => cleanText(value)).filter(Boolean)
      : [],
  );

  const touched: Array<{ importSlug: string; siteSlug: string; retainedUnresolved: number }> = [];
  const skipped: string[] = [];

  for (const filename of importFiles) {
    const importSlug = filename.replace(/\.json$/i, '');
    const siteSlug = canonicalByImportSlug[importSlug];

    if (requestedSlugs.size > 0 && !requestedSlugs.has(importSlug) && !requestedSlugs.has(siteSlug || '')) {
      continue;
    }

    if (!siteSlug) {
      skipped.push(`${importSlug} (unmapped)`);
      continue;
    }

    const evidencePath = path.join(EVIDENCE_DIR, `${siteSlug}.json`);
    if (!fs.existsSync(evidencePath)) {
      skipped.push(`${importSlug} -> ${siteSlug} (missing evidence file)`);
      continue;
    }

    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf-8')) as Record<string, unknown>;
    if (!force && evidence.nonPriceEvidenceImport) {
      skipped.push(`${importSlug} -> ${siteSlug} (already synced)`);
      continue;
    }

    const importPath = path.join(IMPORT_DIR, filename);
    const rawImport = JSON.parse(fs.readFileSync(importPath, 'utf-8')) as RawImportFile;
    const nonPriceEvidenceImport = buildNonPriceEvidenceImport(importSlug, rawImport);

    const nextEvidence = {
      ...evidence,
      nonPriceEvidenceImport,
    };

    fs.writeFileSync(evidencePath, `${JSON.stringify(nextEvidence, null, 2)}\n`, 'utf-8');
    touched.push({
      importSlug,
      siteSlug,
      retainedUnresolved: nonPriceEvidenceImport.retainedUnresolved.length,
    });
  }

  console.log(JSON.stringify({ touched, skipped }, null, 2));
}

main();
