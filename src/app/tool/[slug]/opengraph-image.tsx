import { ImageResponse } from 'next/og';
import toolsData from '@/data/tools.json';
import { Tool } from '@/types/tool';

export const runtime = 'edge';

const tools: Tool[] = toolsData as Tool[];

function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

// Helper to format rating
function formatRating(rating?: number): string {
  if (!rating) return '4.5';
  return rating.toFixed(1);
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) {
    return new Response('Tool not found', { status: 404 });
  }

  // Construct logo URL if available
  // Note: In Edge Runtime, we need to use absolute URLs
  let logoUrl: string | null = null;
  if (tool.logo_url) {
    // For local logos, construct the full URL using environment variable
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://best-ai-video.com';
    logoUrl = tool.logo_url.startsWith('http')
      ? tool.logo_url
      : `${baseUrl}${tool.logo_url}`;
  }

  const rating = formatRating(tool.rating);
  const siteName = 'Best AI Video Tools';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background Pattern Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
        />

        {/* Main Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 60px',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Tool Name with Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '20px',
            }}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt={tool.name}
                width={120}
                height={120}
                style={{
                  borderRadius: '24px',
                  objectFit: 'contain',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
              />
            )}
            <h1
              style={{
                fontSize: '72px',
                fontWeight: '800',
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: '1.1',
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                letterSpacing: '-2px',
              }}
            >
              {tool.name}
            </h1>
          </div>

          {/* Tagline */}
          {tool.tagline && (
            <p
              style={{
                fontSize: '32px',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                maxWidth: '900px',
                lineHeight: '1.4',
                marginTop: '16px',
                fontWeight: '400',
              }}
            >
              {tool.tagline}
            </p>
          )}
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '40px 60px',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Site Name - Bottom Left */}
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '600',
            }}
          >
            {siteName}
          </div>

          {/* Rating Badge - Bottom Right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '12px 24px',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '28px',
              }}
            >
              ⭐
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e3a8a',
              }}
            >
              {rating}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

