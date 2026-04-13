import Link from 'next/link';
import SupportShell from '../../components/layout/SupportShell';

export default function RefundsPage() {
  return (
    <SupportShell
      title="Refunds"
      subtitle="How refunds work when you cancel or when we cancel your flight."
    >
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Voluntary cancellation</h2>
        <p>
          If your fare allows cancellation, you can request it from{' '}
          <Link href="/manage-booking/" className="text-[#1a3570] font-medium hover:underline">
            Manage booking
          </Link>{' '}
          using your reference. Refund amount and fees depend on the fare rules at purchase (non-refundable fares may
          only receive taxes or fees back, if applicable).
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Airline-initiated changes</h2>
        <p>
          If we cancel or significantly delay your flight, you may be offered rebooking or a refund according to
          applicable regulations and your ticket conditions. Our team will contact you using the email on your booking.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing time</h2>
        <p>
          Approved refunds usually return to the original payment method within <strong className="text-gray-900">7–14 business days</strong>, depending on your bank
          or card issuer.
        </p>
      </section>
    </SupportShell>
  );
}
