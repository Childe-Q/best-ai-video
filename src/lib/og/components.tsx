/* eslint-disable @next/next/no-img-element */
/**
 * Reusable Satori-safe OG primitives that mirror the site's lighter card UI:
 * warm paper canvas, soft borders, white surfaces, muted chips, structured
 * comparison rows.
 */

import {
  BRAND_NAME,
  SITE_DOMAIN,
  ogFont,
  siteAccentSoft,
  siteBg,
  siteBlack,
  siteBorder,
  siteBorderStrong,
  siteChipBg,
  siteChipText,
  siteGray,
  siteGrayLight,
  siteLogoBg,
  siteShadow,
  siteShadowSoft,
  siteSurface,
  siteSurfaceMuted,
  siteSurfaceSoft,
} from './theme';

type Align = 'left' | 'center';
type PanelTone = 'default' | 'muted';
type ToolChipSize = 'sm' | 'lg';
type ToolChipTone = 'default' | 'muted';

export function OgContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        backgroundColor: siteBg,
        fontFamily: ogFont,
        padding: '30px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          inset: '18px',
          borderRadius: '32px',
          border: `1px solid ${siteBorder}`,
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: '28px',
          right: '72px',
          width: '220px',
          height: '118px',
          borderRadius: '28px',
          backgroundColor: 'rgba(255,255,255,0.45)',
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: '44px',
          left: '64px',
          width: '168px',
          height: '84px',
          borderRadius: '24px',
          backgroundColor: 'rgba(17,17,17,0.03)',
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function OgMainCard({
  children,
  padding = '34px',
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        borderRadius: '30px',
        border: `1px solid ${siteBorder}`,
        backgroundColor: siteSurface,
        boxShadow: siteShadow,
        padding,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '84px',
          backgroundColor: siteSurfaceSoft,
          borderBottom: `1px solid ${siteBorder}`,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function OgPanel({
  children,
  tone = 'default',
  padding = '18px',
}: {
  children: React.ReactNode;
  tone?: PanelTone;
  padding?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '22px',
        border: `1px solid ${tone === 'muted' ? siteBorder : siteBorderStrong}`,
        backgroundColor: tone === 'muted' ? siteSurfaceMuted : siteSurface,
        boxShadow: tone === 'muted' ? 'none' : siteShadowSoft,
        padding,
      }}
    >
      {children}
    </div>
  );
}

export function OgEyebrowBadge({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          border: `1px solid ${siteBorderStrong}`,
          backgroundColor: siteChipBg,
          boxShadow: '0 1px 0 rgba(17,17,17,0.04)',
          padding: '6px 15px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: '800',
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: siteChipText,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

export function OgInfoPill({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '999px',
        border: `1px solid ${siteBorder}`,
        backgroundColor: siteSurfaceSoft,
        padding: '9px 14px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: siteGray,
          lineHeight: '1.1',
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function OgTitleGroup({
  title,
  subtitle,
  align = 'left',
  titleSize = 52,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: Align;
  titleSize?: number;
}) {
  const isCentered = align === 'center';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCentered ? 'center' : 'flex-start',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: isCentered ? 'center' : 'flex-start',
          gap: '10px',
          color: siteBlack,
          fontSize: `${titleSize}px`,
          fontWeight: '800',
          letterSpacing: '-1.6px',
          lineHeight: '1.05',
          textAlign: isCentered ? 'center' : 'left',
          maxWidth: '100%',
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            display: 'flex',
            marginTop: '16px',
            maxWidth: '860px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: '400',
              lineHeight: '1.45',
              color: siteGray,
              textAlign: isCentered ? 'center' : 'left',
            }}
          >
            {subtitle}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function OgSubtitleRow({ items }: { items: string[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      {items.map((item) => (
        <OgInfoPill key={item} text={item} />
      ))}
    </div>
  );
}

function OgLogoBox({
  name,
  logoUrl,
  size,
}: {
  name: string;
  logoUrl: string | null;
  size: ToolChipSize;
}) {
  const boxSize = size === 'lg' ? 64 : 46;
  const textSize = size === 'lg' ? 24 : 18;

  return (
    <div
      style={{
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size === 'lg' ? '18px' : '14px',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${siteBorder}`,
        boxShadow: '0 1px 0 rgba(17,17,17,0.04)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={boxSize}
          height={boxSize}
          style={{
            width: `${boxSize}px`,
            height: `${boxSize}px`,
            objectFit: 'contain',
            padding: size === 'lg' ? '10px' : '7px',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: `${textSize}px`,
            fontWeight: '800',
            color: siteGrayLight,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function OgToolChip({
  name,
  logoUrl,
  eyebrow,
  detail,
  size = 'sm',
  minWidth,
  fixedHeight,
  tone = 'default',
}: {
  name: string;
  logoUrl: string | null;
  eyebrow?: string;
  detail?: string;
  size?: ToolChipSize;
  minWidth?: number;
  fixedHeight?: number;
  tone?: ToolChipTone;
}) {
  const isLarge = size === 'lg';
  const hasMeta = Boolean(eyebrow || detail);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isLarge ? '14px' : '12px',
        borderRadius: isLarge ? '22px' : '18px',
        border: `1px solid ${siteBorder}`,
        backgroundColor: tone === 'muted' ? siteSurfaceMuted : siteSurface,
        boxShadow: tone === 'muted' ? '0 1px 0 rgba(17,17,17,0.03)' : isLarge ? siteShadowSoft : 'none',
        padding: isLarge ? '14px 18px' : '12px 14px',
        minWidth: minWidth ? `${minWidth}px` : undefined,
        height: fixedHeight ? `${fixedHeight}px` : undefined,
      }}
    >
      <OgLogoBox name={name} logoUrl={logoUrl} size={size} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: '0',
          flex: 1,
        }}
      >
        {eyebrow ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: siteGrayLight,
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <span
          style={{
            marginTop: eyebrow ? '6px' : '0',
            fontSize: isLarge ? '28px' : '20px',
            fontWeight: '700',
            letterSpacing: '-0.7px',
            lineHeight: '1.05',
            color: siteBlack,
            maxWidth: isLarge ? '250px' : '180px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        {detail && hasMeta ? (
          <span
            style={{
              marginTop: '8px',
              fontSize: isLarge ? '15px' : '13px',
              lineHeight: '1.4',
              color: siteGray,
            }}
          >
            {detail}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function OgVsMarker({
  text = 'VS',
  size = 60,
}: {
  text?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '999px',
        backgroundColor: siteSurfaceMuted,
        border: `1px solid ${siteBorderStrong}`,
        boxShadow: `0 0 0 8px ${siteSurface}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: `${Math.round(size * 0.28)}px`,
          fontWeight: '800',
          letterSpacing: '1.2px',
          color: siteBlack,
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function OgFooterMark({
  brandName = BRAND_NAME,
  domain = SITE_DOMAIN,
}: {
  brandName?: string;
  domain?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px',
        padding: '0 8px',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: siteGrayLight,
        }}
      >
        {brandName}
      </span>
      <div
        style={{
          display: 'flex',
          width: '120px',
          height: '1px',
          backgroundColor: siteAccentSoft,
        }}
      />
      <span
        style={{
          fontSize: '12px',
          fontWeight: '500',
          color: siteGrayLight,
        }}
      >
        {domain}
      </span>
    </div>
  );
}

export function OgLogoCard({ src, size = 100 }: { src: string; size?: number }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        borderRadius: '18px',
        objectFit: 'contain',
        backgroundColor: siteLogoBg,
        border: `1px solid ${siteBorder}`,
        padding: '10px',
      }}
    />
  );
}

/* Compat exports kept for existing non-VS OG paths. */
export function OgCard({ children }: { children: React.ReactNode }) {
  return <OgMainCard padding="38px">{children}</OgMainCard>;
}

export function OgBadge({ text }: { text: string }) {
  return <OgEyebrowBadge text={text} />;
}

export function OgBottomBar(props: { brandName?: string; domain?: string }) {
  return <OgFooterMark {...props} />;
}

export function OgLogoChip({ src, size = 40 }: { src: string; size?: number }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        borderRadius: '12px',
        objectFit: 'contain',
        backgroundColor: siteLogoBg,
        border: `1px solid ${siteBorder}`,
        padding: '4px',
      }}
    />
  );
}

export function OgCategoryTag({ text }: { text: string }) {
  return <OgEyebrowBadge text={text} />;
}

export function OgVsBadge() {
  return <OgVsMarker size={48} />;
}

export function OgSubtitle({ text }: { text: string }) {
  return (
    <span style={{ fontSize: '18px', color: siteGray, fontWeight: '400' }}>
      {text}
    </span>
  );
}
