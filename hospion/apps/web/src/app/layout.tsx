import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HOSPİON',
  description: 'Hastane içi dijital talep ve onay yönetimi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
