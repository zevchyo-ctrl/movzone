import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CineStream — Cinema Wrapper Platform',
  description:
    'Immersive cinema streaming viewer powered by a dynamic, admin-managed wrapper platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
