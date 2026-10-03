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
    template: '%s | VoltGrid',
    default: 'VoltGrid | Next-Gen F1 Fantasy',
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
                const stored = localStorage.getItem('voltgrid-theme-storage');
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
            <div className="flex flex-col min-h-screen w-full">
              <Navigation />
              <NasdaqTicker />
              <div className="flex-grow flex flex-col w-full">
                {children}
              </div>
              <Footer />
              <Analytics />
            </div>
          </ThemeWrapper>
        </GlobalProvider>
      </body>
    </html>
  )
}