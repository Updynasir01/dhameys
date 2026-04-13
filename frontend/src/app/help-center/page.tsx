import Link from 'next/link';
import SupportShell from '../../components/layout/SupportShell';

export default function HelpCenterPage() {
  return (
    <SupportShell
      title="Help Center"
      subtitle="Answers to common questions about booking, travel, and your account."
    >
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Booking & payment</h2>
        <p>
          Complete your booking on our website, then pay securely on the payment step. After payment confirms, you will
          receive a confirmation email with your e-ticket PDFs attached when ticket generation completes.
        </p>
        <p>
          Manage or cancel eligible bookings from{' '}
          <Link href="/manage-booking/" className="text-[#1a3570] font-medium hover:underline">
            Manage booking
          </Link>{' '}
          using your booking reference.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Account & sign-in</h2>
        <p>
          Use the same email as your booking to sign in and see trips under{' '}
          <Link href="/my-trips/" className="text-[#1a3570] font-medium hover:underline">
            My trips
          </Link>
          . Forgot your password? Use{' '}
          <Link href="/forgot-password/" className="text-[#1a3570] font-medium hover:underline">
            Forgot password
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">More topics</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <Link href="/baggage/" className="text-[#1a3570] font-medium hover:underline">
              Baggage allowances
            </Link>
          </li>
          <li>
            <Link href="/refunds/" className="text-[#1a3570] font-medium hover:underline">
              Refunds & cancellations
            </Link>
          </li>
          <li>
            <Link href="/contact/" className="text-[#1a3570] font-medium hover:underline">
              Contact us
            </Link>
          </li>
        </ul>
      </section>
    </SupportShell>
  );
}
