import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '../components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = {
  title: { default: 'Dhameys Airlines', template: '%s | Dhameys Airlines' },
  description: 'Book flights with Dhameys Airlines — affordable, reliable, worldwide.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
