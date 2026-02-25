interface TosPageProps {
  onBack: () => void;
}

const LAST_UPDATED = "[Date]";
const APP_NAME = "[App Name]";
const OPERATOR = "[Your Name / Co]";

export function TosPage({ onBack }: TosPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-gray-400 mt-2 text-sm">
            <span className="font-semibold text-gray-300">Last updated:</span> {LAST_UPDATED}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 text-gray-300 leading-relaxed">
        <p>
          These Terms of Service ("Terms") govern your use of {APP_NAME}
          (the "Service") operated by {OPERATOR} ("we", "us", "our").
        </p>

        <p>
          By creating an account or using the Service, you agree to these Terms.
          If you do not agree, do not use the Service.
        </p>

        <hr className="border-neutral-800" />

        <section>
          <h2 className="text-xl font-bold text-white">1. The Service</h2>
          <p className="mt-2 text-sm text-gray-400">
            {APP_NAME} is a language learning application that helps users study
            Chinese vocabulary organized by HSK levels. The Service includes both
            free and premium (paid) features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">2. Accounts</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>You must provide a valid email address to create an account.</li>
            <li>You are responsible for maintaining the security of your account and password.</li>
            <li>You must be at least 13 years old to use the Service.</li>
            <li>One person may not maintain more than one account.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">3. Acceptable Use</h2>
          <p className="mt-2 text-sm text-gray-400">You agree NOT to:</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Scrape, copy, or redistribute the Service's content</li>
            <li>Share your account credentials with others</li>
            <li>Use automated tools (bots) to access the Service</li>
            <li>Resell or redistribute access to the Service</li>
          </ul>
          <p className="mt-2 text-sm text-gray-400">
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">4. Premium Subscription</h2>

          <h3 className="mt-4 text-lg font-semibold text-white">Billing:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>Premium features are available through a paid subscription.</li>
            <li>Subscriptions are billed on a recurring basis (monthly or annually, as selected at checkout).</li>
            <li>Payment is processed securely by Stripe. We do not store your payment card details.</li>
            <li>Prices are listed on the Service and may change with notice.</li>
          </ul>

          <h3 className="mt-4 text-lg font-semibold text-white">Cancellation:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>You may cancel your subscription at any time from your account settings.</li>
            <li>Upon cancellation, you retain access to premium features until the end of your current billing period.</li>
            <li>No partial refunds are provided for unused time within a billing period.</li>
          </ul>

          <h3 className="mt-4 text-lg font-semibold text-white">Refunds:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              If you are unsatisfied with the Service, you may request a full refund within [7] days of your initial
              subscription purchase by contacting us at [your@email.com].
            </li>
            <li>After the [7]-day period, refunds are provided at our discretion.</li>
            <li>Refund requests are typically processed within 5–10 business days.</li>
          </ul>

          <h3 className="mt-4 text-lg font-semibold text-white">EU right of withdrawal:</h3>
          <p className="mt-2 text-sm text-gray-400">
            If you are in the EU/EEA, you have a 14-day right of withdrawal from the date of purchase. By using the
            premium features immediately upon purchase, you acknowledge and agree that you waive this right of
            withdrawal once the digital content has been accessed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">5. Intellectual Property</h2>

          <h3 className="mt-4 text-lg font-semibold text-white">Our content:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              The Service, including its design, code, text, and educational content, is owned by {OPERATOR} and
              protected by copyright and other intellectual property laws.
            </li>
            <li>
              You may not copy, modify, distribute, or create derivative works from our content without written
              permission.
            </li>
          </ul>

          <h3 className="mt-4 text-lg font-semibold text-white">Your data:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>You retain ownership of your personal data and learning progress.</li>
            <li>
              You grant us a limited license to store and process your data solely for the purpose of providing the
              Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">6. Availability and Warranties</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>The Service is provided "as is" and "as available" without warranties of any kind.</li>
            <li>We do not guarantee that the Service will be uninterrupted, error-free, or free of harmful components.</li>
            <li>
              We do not warrant that the educational content is complete, accurate, or suitable for any particular
              purpose.
            </li>
            <li>We may modify, suspend, or discontinue the Service (or any part of it) at any time with reasonable notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">7. Limitation of Liability</h2>
          <p className="mt-2 text-sm text-gray-400">To the maximum extent permitted by law:</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Service.
            </li>
            <li>
              Our total liability for any claim related to the Service shall not exceed the amount you paid us in the 12
              months preceding the claim.
            </li>
            <li>
              This limitation applies regardless of the theory of liability (contract, tort, or otherwise).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">8. Account Deletion</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>You may delete your account at any time from your profile settings.</li>
            <li>Upon deletion, all your personal data and learning progress will be permanently removed from our systems.</li>
            <li>Data held by third parties (Stripe payment records) may be retained as required by law.</li>
            <li>Account deletion is irreversible.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">9. Changes to These Terms</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>We may update these Terms from time to time.</li>
            <li>We will notify you of significant changes via email or a prominent notice on the Service.</li>
            <li>Continued use of the Service after changes constitutes acceptance of the new Terms.</li>
            <li>If you disagree with updated Terms, you may delete your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">10. Governing Law</h2>
          <p className="mt-2 text-sm text-gray-400">
            These Terms are governed by the laws of [Country/State]. Any disputes arising from these Terms or the
            Service shall be resolved in the courts of [Country/State].
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">11. Severability</h2>
          <p className="mt-2 text-sm text-gray-400">
            If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full
            effect.
          </p>
        </section>
      </div>
    </div>
  );
}
