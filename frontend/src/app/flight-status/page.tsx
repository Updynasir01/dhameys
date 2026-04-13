import Link from 'next/link';
import SupportShell from '../../components/layout/SupportShell';

export default function FlightStatusPage() {
  return (
    <SupportShell
      title="Flight status"
      subtitle="Find flights and see scheduled departure information."
    >
      <p>
        Search for available flights and dates on our{' '}
        <Link href="/search/" className="text-[#1a3570] font-medium hover:underline">
          Search flights
        </Link>{' '}
        page. After you book, the latest schedule for your flights appears in{' '}
        <Link href="/my-trips/" className="text-[#1a3570] font-medium hover:underline">
          My trips
        </Link>{' '}
        and in your confirmation email.
      </p>
      <p className="text-gray-500 text-sm">
        For operational disruptions, we notify customers by email and SMS where provided.
      </p>
    </SupportShell>
  );
}
