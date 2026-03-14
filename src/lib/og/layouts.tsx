/**
 * VS OG layouts rebuilt as native-looking UI modules instead of posters.
 */

import {
  OgContainer,
  OgEyebrowBadge,
  OgFooterMark,
  OgLogoCard,
  OgMainCard,
  OgToolChip,
  OgVsMarker,
} from './components';
import {
  adaptiveFontSize,
  comparisonFontSize,
  siteBlack,
  siteChipBg,
  siteChipText,
  siteGray,
  siteGrayLight,
} from './theme';
import type {
  BaseOgData,
  ComparisonOgData,
  ComparisonOgVariant,
  SingleEntityOgData,
} from './types';

export const DEFAULT_COMPARISON_OG_VARIANT: ComparisonOgVariant = 'default';

const DEFAULT_COMPARISON_SUBTITLE = 'Features, pricing, and verdict at a glance.';

function normalizeVariant(input?: string | null): ComparisonOgVariant {
  if (input === 'default' || input === 'a' || !input) return 'default';
  if (input === 'hero' || input === 'b') return 'hero';
  if (input === 'header' || input === 'c') return 'header';
  return 'default';
}

function StableComparisonLayout({
  data,
  badge,
  subtitle,
}: {
  data: ComparisonOgData;
  badge: string;
  subtitle: string;
}) {
  const title = `${data.toolAName} vs ${data.toolBName}`;
  const titleSize = comparisonFontSize(data.toolAName, data.toolBName, 54, 30, 26);

  return (
    <OgContainer>
      <OgMainCard padding="34px 36px 30px">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <OgEyebrowBadge text={badge} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              marginTop: '18px',
            }}
          >
            <span
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '900px',
                fontSize: `${titleSize}px`,
                fontWeight: '800',
                letterSpacing: '-1.7px',
                lineHeight: '1.02',
                color: siteBlack,
                textAlign: 'center',
              }}
            >
              {title}
            </span>
            <span
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                marginTop: '12px',
                fontSize: '17px',
                fontWeight: '500',
                lineHeight: '1.15',
                color: siteGray,
                textAlign: 'center',
              }}
            >
              {subtitle}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              width: '100%',
              marginTop: '8px',
            }}
          >
            <OgToolChip
              name={data.toolAName}
              logoUrl={data.toolALogo}
              size="lg"
              fixedHeight={88}
              minWidth={332}
              tone="muted"
            />
            <OgVsMarker size={56} />
            <OgToolChip
              name={data.toolBName}
              logoUrl={data.toolBLogo}
              size="lg"
              fixedHeight={88}
              minWidth={332}
              tone="muted"
            />
          </div>

          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                display: 'flex',
                fontSize: '12px',
                fontWeight: '500',
                color: siteGrayLight,
                lineHeight: '1',
              }}
            >
              Updated {data.year}
            </span>
          </div>
        </div>
      </OgMainCard>
      <OgFooterMark brandName={data.brandName} domain={data.siteUrl} />
    </OgContainer>
  );
}

function ComparisonDefaultLayout({ data }: { data: ComparisonOgData }) {
  return (
    <StableComparisonLayout
      data={data}
      badge="VS Comparison"
      subtitle={DEFAULT_COMPARISON_SUBTITLE}
    />
  );
}

function ComparisonHeroVariantLayout({ data }: { data: ComparisonOgData }) {
  const titleSize = comparisonFontSize(data.toolAName, data.toolBName, 58, 34, 24);

  return (
    <OgContainer>
      <OgMainCard padding="30px 34px 26px">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <OgEyebrowBadge text="VS Comparison" />
            <span
              style={{
                display: 'flex',
                fontSize: '12px',
                fontWeight: '600',
                color: siteGrayLight,
                lineHeight: '1',
              }}
            >
              Updated {data.year}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              marginTop: '12px',
            }}
          >
            <span
              style={{
                display: 'flex',
                maxWidth: '760px',
                fontSize: `${titleSize}px`,
                fontWeight: '800',
                letterSpacing: '-1.9px',
                lineHeight: '1.01',
                color: siteBlack,
              }}
            >
              {data.toolAName} vs {data.toolBName}
            </span>
            <span
              style={{
                display: 'flex',
                maxWidth: '620px',
                marginTop: '14px',
                fontSize: '18px',
                fontWeight: '500',
                lineHeight: '1.2',
                color: siteGray,
              }}
            >
              A hero-style comparison cover focused on the core choice and the fastest route into the full page.
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              marginTop: '18px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(17,17,17,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <OgToolChip
                name={data.toolAName}
                logoUrl={data.toolALogo}
                size="sm"
                fixedHeight={76}
                minWidth={272}
                tone="muted"
              />
              <OgVsMarker size={46} />
              <OgToolChip
                name={data.toolBName}
                logoUrl={data.toolBLogo}
                size="sm"
                fixedHeight={76}
                minWidth={272}
                tone="muted"
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
                marginTop: '12px',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.6px',
                  color: siteGrayLight,
                  lineHeight: '1',
                }}
              >
                {data.brandName}
              </span>
            </div>
          </div>
        </div>
      </OgMainCard>
    </OgContainer>
  );
}

function ComparisonHeaderSnapshotLayout({ data }: { data: ComparisonOgData }) {
  const titleSize = comparisonFontSize(data.toolAName, data.toolBName, 48, 30, 28);

  return (
    <OgContainer>
      <OgMainCard padding="28px 30px 24px">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <OgEyebrowBadge text="Comparison Header" />
            <span
              style={{
                display: 'flex',
                fontSize: '12px',
                fontWeight: '600',
                color: siteGrayLight,
                lineHeight: '1',
              }}
            >
              Updated {data.year}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              marginTop: '18px',
            }}
          >
            <span
              style={{
                display: 'flex',
                maxWidth: '900px',
                fontSize: `${titleSize}px`,
                fontWeight: '800',
                letterSpacing: '-1.6px',
                lineHeight: '1.03',
                color: siteBlack,
              }}
            >
              {data.toolAName} vs {data.toolBName}
            </span>
            <span
              style={{
                display: 'flex',
                maxWidth: '760px',
                marginTop: '12px',
                fontSize: '17px',
                fontWeight: '500',
                lineHeight: '1.18',
                color: siteGray,
              }}
            >
              A header snapshot built like a real comparison module: title on top, structured comparison row underneath.
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              width: '100%',
              marginTop: '24px',
              padding: '16px',
              borderRadius: '24px',
              border: '1px solid rgba(17,17,17,0.08)',
              backgroundColor: 'rgba(248,245,238,0.9)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flex: 1,
              }}
            >
              <OgToolChip
                name={data.toolAName}
                logoUrl={data.toolALogo}
                size="lg"
                fixedHeight={88}
                minWidth={0}
                tone="default"
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '92px',
              }}
            >
              <OgVsMarker size={50} />
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
              }}
            >
              <OgToolChip
                name={data.toolBName}
                logoUrl={data.toolBLogo}
                size="lg"
                fixedHeight={88}
                minWidth={0}
                tone="default"
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: '14px',
            }}
          >
            <span
              style={{
                display: 'flex',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.6px',
                color: siteGrayLight,
                lineHeight: '1',
              }}
            >
              Feature fit, pricing, and verdict
            </span>
            <span
              style={{
                display: 'flex',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.6px',
                color: siteGrayLight,
                lineHeight: '1',
              }}
            >
              {data.siteUrl}
            </span>
          </div>
        </div>
      </OgMainCard>
    </OgContainer>
  );
}

export function renderComparisonOgLayout(
  data: ComparisonOgData,
  variant?: string | null,
) {
  const normalized = normalizeVariant(variant);

  if (normalized === 'hero') {
    return <ComparisonHeroVariantLayout data={data} />;
  }

  if (normalized === 'header') {
    return <ComparisonHeaderSnapshotLayout data={data} />;
  }

  return <ComparisonDefaultLayout data={data} />;
}

export function SingleEntityLayout({ data }: { data: SingleEntityOgData }) {
  const nameSize = adaptiveFontSize(data.name, 64, 36, 14);

  return (
    <OgContainer>
      <OgMainCard padding="38px">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '16px',
          }}
        >
          {data.logoUrl && <OgLogoCard src={data.logoUrl} />}
          <span
            style={{
              fontSize: `${nameSize}px`,
              fontWeight: '900',
              color: siteBlack,
              letterSpacing: '-1.5px',
              lineHeight: '1.1',
            }}
          >
            {data.name}
          </span>
        </div>

        {data.tagline ? (
          <span
            style={{
              fontSize: '26px',
              color: siteGray,
              maxWidth: '820px',
              lineHeight: '1.4',
              fontWeight: '400',
            }}
          >
            {data.tagline}
          </span>
        ) : null}

        {data.badge ? (
          <div style={{ display: 'flex', marginTop: '18px' }}>
            <OgEyebrowBadge text={data.badge} />
          </div>
        ) : null}
      </OgMainCard>

      <OgFooterMark brandName={data.brandName} domain={data.siteUrl} />
    </OgContainer>
  );
}

export function FallbackLayout({
  heading = 'AI Video Tool Comparison',
  data,
}: {
  heading?: string;
  data?: BaseOgData;
}) {
  return (
    <OgContainer>
      <OgMainCard padding="42px">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <OgEyebrowBadge text="Comparison" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '999px',
              padding: '7px 14px',
              backgroundColor: siteChipBg,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.2px',
                color: siteChipText,
                textTransform: 'uppercase',
              }}
            >
              OG fallback
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              color: siteBlack,
              fontSize: '46px',
              fontWeight: '800',
              letterSpacing: '-1.4px',
              lineHeight: '1.05',
            }}
          >
            <span>{heading}</span>
          </div>
          <span
            style={{
              display: 'flex',
              marginTop: '16px',
              maxWidth: '860px',
              fontSize: '20px',
              fontWeight: '400',
              lineHeight: '1.45',
              color: siteGray,
            }}
          >
            Comparison layout available, but no specific tool pair data was found for this slug.
          </span>
        </div>
      </OgMainCard>
      <OgFooterMark brandName={data?.brandName} domain={data?.siteUrl} />
    </OgContainer>
  );
}
