import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('No URL provided', { status: 400 });
  }

  // Validate URL to prevent open redirects
  try {
    const url = new URL(targetUrl);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return new Response('Invalid URL protocol', { status: 400 });
    }
  } catch (error) {
    return new Response('Invalid URL format', { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="referrer" content="no-referrer" />
    <meta http-equiv="refresh" content="0;url=${targetUrl}" />
    <title>Redirecting...</title>
  </head>
  <body>Redirecting to secure partner...</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

