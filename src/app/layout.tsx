import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalProvider } from "../../global-context";
import AppLayoutWrapper from "../components/AppLayoutWrapper";
import { Analytics } from "@vercel/analytics/next";



export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | TS1',
    default: 'The Strategist One (TS1)',
  },
  description: 'The ultimate F1 Fantasy and Racing Management experience.',
};

import { allFontVariables } from './fonts';
import ThemeWrapper from '../components/ThemeWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={allFontVariables} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let mode = 'dark';
                let stored = localStorage.getItem('ts1-theme-storage');
                if (!stored) {
                  const legacyStored = localStorage.getItem('baeff1-theme-storage') || localStorage.getItem('voltgrid-theme-storage');
                  if (legacyStored) {
                    stored = legacyStored;
                    localStorage.setItem('ts1-theme-storage', legacyStored);
                    localStorage.removeItem('baeff1-theme-storage');
                    localStorage.removeItem('voltgrid-theme-storage');
                  }
                }
                if (stored) {
                  const parsed = JSON.parse(stored);
                  if (parsed.state && parsed.state.mode) {
                    mode = parsed.state.mode;
                  }
                }
                if (mode === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <GlobalProvider initialLocales={undefined}>
          <ThemeWrapper>
            <AppLayoutWrapper>
              {children}
              <Analytics />
            </AppLayoutWrapper>
          </ThemeWrapper>
        </GlobalProvider>
      </body>
    </html>
  )
}