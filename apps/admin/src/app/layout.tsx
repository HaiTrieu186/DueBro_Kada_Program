import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Due Bro — Ops Admin Dashboard',
  description: 'Internal operations dashboard for Due Bro roommate management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#181818] text-[#FAFAF9] antialiased">
        {children}
      </body>
    </html>
  );
}
