import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Due Bro — Ops Admin Dashboard',
  description: 'Bảng điều khiển vận hành Due Bro theo chuẩn Prodify Design (Google Sans)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Google+Sans+Text:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8F8FD] text-[#14142B] font-['Google_Sans','Google_Sans_Text',-apple-system,BlinkMacSystemFont,sans-serif] antialiased selection:bg-[#EEEDFB] selection:text-[#5B4BDB]">
        {children}
      </body>
    </html>
  );
}
