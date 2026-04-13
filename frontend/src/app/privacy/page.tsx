import SupportShell from '../../components/layout/SupportShell';

export default function PrivacyPage() {
  return (
    <SupportShell title="Privacy policy" subtitle="How we handle your personal data.">
      <p>
        Dhameys Airlines collects and uses personal information you provide when you book, create an account, or contact
        us — for example name, contact details, passport data where required, and payment references processed by our
        payment partners.
      </p>
      <p>
        We use this information to operate your booking, comply with aviation security requirements, and improve our
        services. We do not sell your personal data.
      </p>
      <p className="text-gray-500 text-sm">This is a summary for the demo app. Replace with your legal privacy policy.</p>
    </SupportShell>
  );
}
