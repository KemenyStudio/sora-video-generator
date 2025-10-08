import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import HeaderAuth from '@/components/HeaderAuth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sora Video Generator',
  description: 'Create stunning AI videos with OpenAI Sora',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="fixed top-0 right-0 z-50 p-4">
          <HeaderAuth />
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}