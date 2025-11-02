import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instagram Automation Agent',
  description: 'Automate IG images and captions with instant posting',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
