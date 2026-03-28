import type { Metadata } from "next";
import Script from "next/script";
// Removed Google Fonts imports
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import { getSEOCurrentYear } from "@/lib/utils";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/jsonLd";

const seoYear = getSEOCurrentYear();

const EARLY_MASKED_URL_ERROR_GUARD = `
(function () {
  function isMaskedInjectedPostMessageError(message, source) {
    var normalizedMessage = String(message || '').toLowerCase();
    var normalizedSource = String(source || '');
    return normalizedMessage.includes('postmessage') && (
      normalizedSource.includes('webkit-masked-url') ||
      normalizedSource.includes('hidden/:') ||
      normalizedSource.includes('safari-web-extension://') ||
      normalizedSource.includes('chrome-extension://') ||
      normalizedSource.includes('moz-extension://')
    );
  }

  function isInjectedScriptError(message, source, name) {
    var normalizedMessage = String(message || '');
    var normalizedSource = String(source || '');
    return (
      normalizedMessage.includes('_0x') ||
      normalizedMessage.includes('webkit-masked-url') ||
      normalizedMessage.includes('hidden/:') ||
      normalizedMessage.includes('safari-web-extension://') ||
      normalizedMessage.includes('chrome-extension://') ||
      normalizedMessage.includes('moz-extension://') ||
      normalizedSource.includes('webkit-masked-url') ||
      normalizedSource.includes('hidden/:') ||
      normalizedSource.includes('safari-web-extension://') ||
      normalizedSource.includes('chrome-extension://') ||
      normalizedSource.includes('moz-extension://') ||
      isMaskedInjectedPostMessageError(normalizedMessage, normalizedSource) ||
      (String(name || '') === 'NotAllowedError' && normalizedSource.includes('webkit-masked-url'))
    );
  }

  window.addEventListener('error', function (event) {
    var error = event.error || {};
    var message = error.message || event.message || '';
    var name = error.name || '';
    var source = [event.filename || '', error.stack || '', String(error || '')].join(' ');

    if (isInjectedScriptError(message, source, name)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    var error = event.reason || {};
    var message = error.message || String(error || '');
    var name = error.name || '';
    var source = [error.stack || '', String(error || '')].join(' ');

    if (isInjectedScriptError(message, source, name)) {
      event.preventDefault();
      return false;
    }
  }, true);
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL('https://best-ai-video.com'),
  title: {
    template: '%s | Best AI Video Tools',
    default: `Best AI Video Tools in ${seoYear} | Reviews & Comparisons`,
  },
  description: "Compare features, pricing, pros & cons, and alternatives of top AI video software.",
  verification: {
    google: "q56dscmxkvtyDq85VzA0r0pDrZRl272wuwBbujtiMts",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <Script
          id="early-masked-url-error-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: EARLY_MASKED_URL_ERROR_GUARD }}
        />
        {/* Structured Data: Organization + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }}
        />
        {/* Impact Site Verification */}
        <div style={{ display: 'none' }}>Impact-Site-Verification: 85a12125-5860-4b7e-960f-d1d65fe37656</div>
        <GlobalErrorHandler />
        <Header />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
