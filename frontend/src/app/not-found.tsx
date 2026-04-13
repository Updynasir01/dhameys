import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center bg-gray-50">
      <p className="text-lg font-semibold text-gray-900">
        <span className="font-bold">404</span>
        <span className="mx-2 text-gray-300">|</span>
        This page could not be found.
      </p>
      <Link href="/" className="text-[#1a3570] font-medium hover:underline">
        Back to home
      </Link>
    </div>
  );
}
