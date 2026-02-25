interface PrivacyPageProps {
  onBack: () => void;
}

const LAST_UPDATED = "[Date]";
const APP_NAME = "[App Name]";
const APP_DOMAIN = "[yourapp.com]";

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
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
          This Privacy Policy describes how {APP_NAME} ("we", "us", "our") collects,
          uses, and protects your personal information when you use our website and
          services at {APP_DOMAIN} (the "Service").
        </p>

        <p>
          By using the Service, you agree to the collection and use of information
          in accordance with this policy.
        </p>

        <hr className="border-neutral-800" />

        <section>
          <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>

          <h3 className="mt-4 text-lg font-semibold text-white">Information you provide directly:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              <span className="text-gray-200 font-semibold">Account information:</span> email address and password when you create
              an account
            </li>
            <li>
              <span className="text-gray-200 font-semibold">Payment information:</span> processed securely by Stripe; we do not
              store your credit card number, only a reference to your Stripe
              customer ID
            </li>
          </ul>

          <h3 className="mt-5 text-lg font-semibold text-white">Information collected automatically:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              <span className="text-gray-200 font-semibold">Usage data:</span> your learning progress (which words you have marked
              as learned), stored in our database linked to your account
            </li>
            <li>
              <span className="text-gray-200 font-semibold">Technical data:</span> browser type, device type, and general access
              logs provided by our hosting platform (Vercel)
            </li>
          </ul>

          <h3 className="mt-5 text-lg font-semibold text-white">Information we do NOT collect:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>We do not use third-party analytics or advertising trackers</li>
            <li>We do not sell or share your data with advertisers</li>
            <li>We do not collect precise geolocation data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">2. How We Use Your Information</h2>
          <p className="mt-2 text-sm text-gray-400">We use your information solely to:</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>Provide and maintain the Service (your account and learning progress)</li>
            <li>Process payments and manage your subscription</li>
            <li>Communicate with you about your account (e.g., password reset)</li>
            <li>Improve the Service (aggregated, non-identifying usage patterns)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">3. Data Storage and Third-Party Services</h2>
          <p className="mt-2 text-sm text-gray-400">We rely on the following third-party services to operate:</p>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm border border-neutral-800 rounded-xl overflow-hidden">
              <thead className="bg-neutral-900/70">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-300 font-semibold">Service</th>
                  <th className="text-left px-4 py-3 text-gray-300 font-semibold">Purpose</th>
                  <th className="text-left px-4 py-3 text-gray-300 font-semibold">Their Privacy Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                <tr>
                  <td className="px-4 py-3">Supabase</td>
                  <td className="px-4 py-3 text-gray-400">Authentication &amp; database</td>
                  <td className="px-4 py-3">
                    <a
                      className="text-red-400 hover:underline"
                      href="https://supabase.com/privacy"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://supabase.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Stripe</td>
                  <td className="px-4 py-3 text-gray-400">Payment processing</td>
                  <td className="px-4 py-3">
                    <a
                      className="text-red-400 hover:underline"
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://stripe.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Vercel</td>
                  <td className="px-4 py-3 text-gray-400">Hosting</td>
                  <td className="px-4 py-3">
                    <a
                      className="text-red-400 hover:underline"
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://vercel.com/legal/privacy-policy
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Your data may be stored in data centers operated by these providers.
            We have Data Processing Agreements (DPAs) in place with each provider
            where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">4. Data Retention</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              <span className="text-gray-200 font-semibold">Account data:</span> retained as long as your account is active.
              Deleted when you delete your account.
            </li>
            <li>
              <span className="text-gray-200 font-semibold">Learning progress:</span> retained as long as your account is active.
              Deleted when you delete your account.
            </li>
            <li>
              <span className="text-gray-200 font-semibold">Payment records:</span> retained as required by tax and financial
              regulations (typically up to 7 years for transaction records
              held by Stripe).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">For EU/EEA residents (GDPR):</h2>
          <p className="mt-2 text-sm text-gray-400">Our legal basis for processing your data is:</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>
              <span className="text-gray-200 font-semibold">Contract performance:</span> we need your data to provide the Service
              you signed up for
            </li>
            <li>
              <span className="text-gray-200 font-semibold">Legitimate interest:</span> improving the Service based on aggregated
              usage patterns
            </li>
          </ul>
          <p className="mt-2 text-sm text-gray-400">
            You have the right to lodge a complaint with your local data
            protection authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">For California residents (CCPA):</h2>
          <p className="mt-2 text-sm text-gray-400">
            We do not sell your personal information. You have the right to know
            what data we collect and to request its deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">7. Cookies and Local Storage</h2>
          <p className="mt-2 text-sm text-gray-400">We use browser local storage (similar to cookies) to:</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>Keep you logged in (authentication tokens)</li>
            <li>Cache your learning progress locally for performance</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">8. Security</h2>
          <p className="mt-2 text-sm text-gray-400">We take reasonable measures to protect your data:</p>
          <ul className="mt-2 space-y-2 text-sm text-gray-400 list-disc pl-5">
            <li>All connections use HTTPS/TLS encryption</li>
            <li>Passwords are hashed using bcrypt (handled by Supabase Auth)</li>
            <li>Payment data is handled entirely by Stripe (PCI-DSS compliant)</li>
            <li>Database access is protected by Row Level Security policies</li>
            <li>Secret keys are stored in server-side environment variables only</li>
          </ul>
          <p className="mt-2 text-sm text-gray-400">
            No method of transmission over the internet is 100% secure. We cannot
            guarantee absolute security but we strive to use commercially
            acceptable means to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">9. Children&apos;s Privacy</h2>
          <p className="mt-2 text-sm text-gray-400">
            The Service is not intended for children under 13. We do not knowingly
            collect personal information from children under 13. If you believe a
            child has provided us with personal data, please contact us and we
            will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">10. Changes to This Policy</h2>
          <p className="mt-2 text-sm text-gray-400">
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting a notice on the Service or
            sending an email. Your continued use of the Service after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
