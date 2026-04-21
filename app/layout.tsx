import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soulync — Meet in 48 hours',
  description: 'AI-powered dating that gets you off the app and into real life.',
  manifest: '/manifest.json',
  themeColor: '#1a1a1a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#FAFAF7' }}>
        {children}
      </body>
    </html>
  );
}
