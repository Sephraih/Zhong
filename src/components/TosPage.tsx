interface TosPageProps {
  onBack: () => void;
}

export function TosPage({ onBack }: TosPageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Terms of Service</h2>
          <p className="text-gray-400 mt-1 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Agreement</h3>
          <p className="mt-2 text-sm text-gray-400">
            By using this app, you agree to these terms. If you do not agree, do not use the app.
          </p>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Accounts</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>You are responsible for keeping your login credentials secure.</li>
            <li>You must not attempt to abuse or disrupt the service.</li>
            <li>You may delete your account at any time from the Profile page.</li>
          </ul>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Purchases</h3>
          <p className="mt-2 text-sm text-gray-400">
            Purchases are processed via Stripe. Your access is granted after successful payment.
            Refunds and disputes are handled according to Stripe and the app owner’s policies.
          </p>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Disclaimers</h3>
          <p className="mt-2 text-sm text-gray-400">
            The app is provided “as is” without warranties. We do our best to keep the service
            reliable, but we can’t guarantee uninterrupted access.
          </p>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Contact</h3>
          <p className="mt-2 text-sm text-gray-400">
            If you have questions about these terms, contact the app owner.
          </p>
        </section>
      </div>
    </div>
  );
}
