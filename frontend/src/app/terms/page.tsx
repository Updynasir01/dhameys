import SupportShell from '../../components/layout/SupportShell';

export default function TermsPage() {
  return (
    <SupportShell title="Terms of use" subtitle="Rules for using our website and services.">
      <p>
        By using Dhameys Airlines websites and services, you agree to book and travel according to our fare rules,
        conditions of carriage, and applicable law. Tickets are subject to availability and confirmation at payment.
      </p>
      <p>
        You are responsible for accurate passenger information and valid travel documents. We may refuse carriage if
        requirements are not met.
      </p>
      <p className="text-gray-500 text-sm">This is a summary for the demo app. Replace with your legal terms.</p>
    </SupportShell>
  );
}
