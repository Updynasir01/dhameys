'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/** Legacy URL: /payment?... → real route is /booking/payment */
function RedirectToBookingPayment() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/booking/payment?${q}` : '/booking/payment');
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
      Redirecting to payment…
    </div>
  );
}

export default function LegacyPaymentRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading…</div>
      }
    >
      <RedirectToBookingPayment />
    </Suspense>
  );
}
