import type { Metadata } from 'next';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import 'leaflet/dist/leaflet.css';
import '../index.css';

export const metadata: Metadata = {
  title: 'CamRoute - Mboa Radar',
  description: 'CamRoute Application - Sécurité routière et radars au Cameroun',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mboa Radar',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
