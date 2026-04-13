import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function SupportShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-gray-500 text-sm sm:text-base">{subtitle}</p> : null}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-gray-600 text-sm sm:text-base leading-relaxed space-y-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
