interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-lg prose prose-invert max-w-none">
        <p className="text-gray-400 text-sm mb-6">
          <strong>Last updated:</strong> January 2025
        </p>

        <p className="text-gray-300 mb-6">
          This Privacy Policy describes how HamHao ("we", "us", "our") collects,
          uses, and protects your personal information when you use our website and
          services at{" "}
          <a href="https://hamhao.com" className="text-red-400 hover:text-red-300">
            hamhao.com
          </a>{" "}
          (the "Service").
        </p>

        <p className="text-gray-300 mb-8">
          By using the Service, you agree to the collection and use of information
          in accordance with this policy.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Information you provide directly:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            <strong>Account information:</strong> email address and password when you create
            an account
          </li>
          <li>
            <strong>Payment information:</strong> processed securely by Stripe; we do not
            store your credit card number, only a reference to your Stripe customer ID
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Information collected automatically:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            <strong>Usage data:</strong> your learning progress (which words you have marked
            as learned), stored in our database linked to your account
          </li>
          <li>
            <strong>Technical data:</strong> browser type, device type, and general access
            logs provided by our hosting platform (Vercel)
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Information we do NOT collect:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>We do not use third-party analytics or advertising trackers</li>
          <li>We do not sell or share your data with advertisers</li>
          <li>We do not collect precise geolocation data</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-300 mb-4">We use your information solely to:</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>Provide and maintain the Service (your account and learning progress)</li>
          <li>Process payments and manage your purchases</li>
          <li>Communicate with you about your account (e.g., password reset)</li>
          <li>Improve the Service (aggregated, non-identifying usage patterns)</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Data Storage and Third-Party Services</h2>
        <p className="text-gray-300 mb-4">We rely on the following third-party services to operate:</p>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left text-gray-300 text-sm">
            <thead className="border-b border-neutral-700">
              <tr>
                <th className="py-2 pr-4 font-semibold text-white">Service</th>
                <th className="py-2 pr-4 font-semibold text-white">Purpose</th>
                <th className="py-2 font-semibold text-white">Privacy Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              <tr>
                <td className="py-2 pr-4">Supabase</td>
                <td className="py-2 pr-4">Authentication & database</td>
                <td className="py-2">
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300">
                    supabase.com/privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Stripe</td>
                <td className="py-2 pr-4">Payment processing</td>
                <td className="py-2">
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300">
                    stripe.com/privacy
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Vercel</td>
                <td className="py-2 pr-4">Hosting</td>
                <td className="py-2">
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300">
                    vercel.com/legal/privacy-policy
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-gray-300">
          Your data may be stored in data centers operated by these providers.
          We have Data Processing Agreements (DPAs) in place with each provider
          where required.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Data Retention</h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            <strong>Account data:</strong> retained as long as your account is active.
            Deleted when you delete your account.
          </li>
          <li>
            <strong>Learning progress:</strong> retained as long as your account is active.
            Deleted when you delete your account.
          </li>
          <li>
            <strong>Payment records:</strong> retained as required by tax and financial
            regulations (typically up to 7 years for transaction records held by Stripe).
          </li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Your Rights</h2>
        <p className="text-gray-300 mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            <strong>Access:</strong> request a copy of the personal data we hold about you
          </li>
          <li>
            <strong>Correction:</strong> request correction of inaccurate data
          </li>
          <li>
            <strong>Deletion:</strong> request deletion of your account and all associated
            data (available via the "Delete Account" button in your profile settings)
          </li>
          <li>
            <strong>Data portability:</strong> request your data in a machine-readable format
          </li>
          <li>
            <strong>Withdraw consent:</strong> you may stop using the Service at any time
          </li>
        </ul>

        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 my-6">
          <p className="text-gray-300 text-sm">
            <strong className="text-white">📥 Self-Service Data Export:</strong> You can download all your
            data (profile, learning progress, purchases) anytime from your{" "}
            <strong>Profile → Your Data → Export My Data</strong> button. No need to contact us.
          </p>
        </div>

        <p className="text-gray-300 mb-4">
          For other requests or questions, contact us at{" "}
          <a href="mailto:support@hamhao.com" className="text-red-400 hover:text-red-300">
            support@hamhao.com
          </a>
          . We will respond within 30 days.
        </p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">For EU/EEA residents (GDPR):</h3>
        <p className="text-gray-300 mb-2">Our legal basis for processing your data is:</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            <strong>Contract performance:</strong> we need your data to provide the Service
            you signed up for
          </li>
          <li>
            <strong>Legitimate interest:</strong> improving the Service based on aggregated
            usage patterns
          </li>
        </ul>
        <p className="text-gray-300 mb-4">
          You have the right to lodge a complaint with your local data protection authority.
        </p>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">For California residents (CCPA):</h3>
        <p className="text-gray-300 mb-4">
          We do not sell your personal information. You have the right to know
          what data we collect and to request its deletion.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Cookies and Local Storage</h2>
        <p className="text-gray-300 mb-2">
          We use <strong>browser local storage</strong> (similar to cookies) to:
        </p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>Keep you logged in (authentication tokens)</li>
          <li>Cache your learning progress locally for performance</li>
        </ul>
        <p className="text-gray-300">
          We do <strong>not</strong> use tracking cookies, advertising cookies, or
          third-party analytics cookies.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Security</h2>
        <p className="text-gray-300 mb-2">We take reasonable measures to protect your data:</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>All connections use HTTPS/TLS encryption</li>
          <li>Passwords are hashed using bcrypt (handled by Supabase Auth)</li>
          <li>Payment data is handled entirely by Stripe (PCI-DSS compliant)</li>
          <li>Database access is protected by Row Level Security policies</li>
          <li>Secret keys are stored in server-side environment variables only</li>
        </ul>
        <p className="text-gray-300">
          No method of transmission over the internet is 100% secure. We cannot
          guarantee absolute security but we strive to use commercially
          acceptable means to protect your data.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Children's Privacy</h2>
        <p className="text-gray-300">
          The Service is not intended for children under 13. We do not knowingly
          collect personal information from children under 13. If you believe a
          child has provided us with personal data, please contact us and we
          will delete it.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">9. Changes to This Policy</h2>
        <p className="text-gray-300">
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes by posting a notice on the Service or
          sending an email. Your continued use of the Service after changes
          constitutes acceptance of the updated policy.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">10. Contact</h2>
        <p className="text-gray-300">
          If you have any questions about this Privacy Policy, contact us at:
        </p>
        <div className="mt-4 p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-white font-semibold">HamHao</p>
          <p className="text-gray-300">
            Website:{" "}
            <a href="https://hamhao.com" className="text-red-400 hover:text-red-300">
              HamHao.com
            </a>
          </p>
          <p className="text-gray-300">
            Email:{" "}
            <a href="mailto:support@hamhao.com" className="text-red-400 hover:text-red-300">
              support@hamhao.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
