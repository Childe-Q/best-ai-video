import { ReactNode } from 'react';

interface AlternativesSubLayoutProps {
  children: ReactNode;
}

export default function AlternativesSubLayout({ children }: AlternativesSubLayoutProps) {
  return (
    <>
      <style>{`#tool-layout-summary-grid{display:none !important;}`}</style>
      {children}
    </>
  );
}
