interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Privacy Policy</h2>
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
          <h3 className="text-lg font-semibold text-white">Summary</h3>
          <p className="mt-2 text-sm text-gray-400">
            This app helps you learn Chinese vocabulary. We store only what we need to provide the
            service (authentication, purchases, and your learning progress if you choose to sync it).
          </p>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Data we store</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              <span className="text-gray-200 font-medium">Account data</span>: email address and account identifiers
              (via Supabase Auth).
            </li>
            <li>
              <span className="text-gray-200 font-medium">Purchase data</span>: which HSK levels you unlocked and the
              Stripe payment reference (no raw card details are stored by us).
            </li>
            <li>
              <span className="text-gray-200 font-medium">Learning progress</span>: a compact bitset indicating which
              words you marked as learned (only when you are signed in).
            </li>
            <li>
              <span className="text-gray-200 font-medium">Local device storage</span>: we use localStorage to cache
              vocabulary and to keep your progress available offline.
            </li>
          </ul>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Third parties</h3>
          <p className="mt-2 text-sm text-gray-400">
            We use:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>Supabase for authentication and database storage.</li>
            <li>Stripe for payments (card details are handled by Stripe).</li>
          </ul>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Your choices</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>You can use the app without an account (limited free preview).</li>
            <li>If you create an account, your progress can sync across devices.</li>
            <li>You can delete your account from the Profile page (Danger zone).</li>
          </ul>
        </section>

        <section className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Contact</h3>
          <p className="mt-2 text-sm text-gray-400">
            If you have questions about privacy, contact the app owner.
          </p>
        </section>
      </div>
    </div>
  );
}
