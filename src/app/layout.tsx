import type { Metadata } from "next";
// Removed Google Fonts imports
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import { getSEOCurrentYear } from "@/lib/utils";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/jsonLd";

const seoYear = getSEOCurrentYear();

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

