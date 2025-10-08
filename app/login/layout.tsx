import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Sign In - Sora Video Generator',
  description: 'Sign in to save your video history and track usage',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

