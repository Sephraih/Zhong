import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  const { user, exportMyData } = useAuth();
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
      >
        ← Back
      </button>

      {exportError && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm">
          {exportError}
        </div>
      )}

      <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-lg prose prose-invert prose-sm max-w-none prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline prose-hr:border-neutral-700">
        {/* Data export (self-service) */}
        <div className="not-prose mb-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <h2 className="text-sm font-semibold text-white">Export your data</h2>
          <p className="mt-1 text-sm text-gray-400">
            Download a JSON file containing the data we store about your account, purchases, and learning progress.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={exportBusy}
              onClick={async () => {
                setExportError(null);
                if (!user) {
                  setExportError("Please sign in to export your data.");
                  return;
                }
                try {
                  setExportBusy(true);
                  await exportMyData();
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Failed to export data";
                  setExportError(msg);
                } finally {
                  setExportBusy(false);
                }
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-neutral-900 border border-neutral-800 text-gray-200 hover:bg-neutral-800 hover:border-neutral-700 transition-colors disabled:opacity-60"
            >
              {exportBusy ? "Preparing download…" : "📥 Export My Data"}
            </button>

            {!user && (
              <button
                type="button"
                onClick={() => {
                  window.location.hash = "profile";
                  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {user
              ? "Your download will start immediately."
              : "Sign in to enable self-service export. If you are already signed in, refresh and try again."}
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8"><strong>Last updated:</strong> February 2025</p>

        <p className="text-gray-300 leading-relaxed">
          This Privacy Policy describes how ZhongCang ("we", "us", "our") collects,
          uses, and protects your personal information when you use our website and
          services at{" "}
          <a href="https://zhong-theta.vercel.app" className="text-red-400 hover:text-red-300" target="_blank" rel="noopener noreferrer">
            https://zhong-theta.vercel.app
          </a>{" "}
          (the "Service").
        </p>
        <p className="text-gray-300 leading-relaxed">
          By using the Service, you agree to the collection and use of information
          in accordance with this policy.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 1 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>

        <h3 className="text-lg font-medium text-gray-200 mt-6 mb-3">Information you provide directly:</h3>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li><strong className="text-white">Account information:</strong> email address and password when you create an account</li>
          <li><strong className="text-white">Payment information:</strong> processed securely by Stripe; we do not store your credit card number, only a reference to your Stripe customer ID</li>
        </ul>

        <h3 className="text-lg font-medium text-gray-200 mt-6 mb-3">Information collected automatically:</h3>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li><strong className="text-white">Usage data:</strong> your learning progress (which words you have marked as learned), stored in our database linked to your account</li>
          <li><strong className="text-white">Technical data:</strong> browser type, device type, and general access logs provided by our hosting platform (Vercel)</li>
        </ul>

        <h3 className="text-lg font-medium text-gray-200 mt-6 mb-3">Information we do NOT collect:</h3>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li>We do not use third-party analytics or advertising trackers</li>
          <li>We do not sell or share your data with advertisers</li>
          <li>We do not collect precise geolocation data</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        {/* Section 2 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-300 mb-3">We use your information solely to:</p>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li>Provide and maintain the Service (your account and learning progress)</li>
          <li>Process payments and manage your subscription</li>
          <li>Communicate with you about your account (e.g., password reset)</li>
          <li>Improve the Service (aggregated, non-identifying usage patterns)</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        {/* Section 3 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Data Storage and Third-Party Services</h2>
        <p className="text-gray-300 mb-4">We rely on the following third-party services to operate:</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-gray-200 font-semibold">Service</th>
                <th className="text-left py-2 pr-4 text-gray-200 font-semibold">Purpose</th>
                <th className="text-left py-2 text-gray-200 font-semibold">Their Privacy Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4 text-gray-300">Supabase</td>
                <td className="py-2 pr-4 text-gray-300">Authentication & database</td>
                <td className="py-2"><a href="https://supabase.com/privacy" className="text-red-400 hover:text-red-300" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4 text-gray-300">Stripe</td>
                <td className="py-2 pr-4 text-gray-300">Payment processing</td>
                <td className="py-2"><a href="https://stripe.com/privacy" className="text-red-400 hover:text-red-300" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4 text-gray-300">Vercel</td>
                <td className="py-2 pr-4 text-gray-300">Hosting</td>
                <td className="py-2"><a href="https://vercel.com/legal/privacy-policy" className="text-red-400 hover:text-red-300" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-gray-300">
          Your data may be stored in data centers operated by these providers.
          We have Data Processing Agreements (DPAs) in place with each provider where required.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 4 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Data Retention</h2>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li><strong className="text-white">Account data:</strong> retained as long as your account is active. Deleted when you delete your account.</li>
          <li><strong className="text-white">Learning progress:</strong> retained as long as your account is active. Deleted when you delete your account.</li>
          <li><strong className="text-white">Payment records:</strong> retained as required by tax and financial regulations (typically up to 7 years for transaction records held by Stripe).</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        {/* Section 5 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
        <p className="text-gray-300 mb-3">Depending on your location, you may have the following rights:</p>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li><strong className="text-white">Access:</strong> request a copy of the personal data we hold about you</li>
          <li><strong className="text-white">Correction:</strong> request correction of inaccurate data</li>
          <li><strong className="text-white">Deletion:</strong> request deletion of your account and all associated data (available via the "Delete Account" button in your profile settings, or by contacting us)</li>
          <li><strong className="text-white">Data portability:</strong> request your data in a machine-readable format</li>
          <li><strong className="text-white">Withdraw consent:</strong> you may stop using the Service at any time</li>
        </ul>
        <p className="text-gray-300 mt-3">
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:zhong@cang.com" className="text-red-400 hover:text-red-300">zhong@cang.com</a>.
          We will respond within 30 days.
        </p>

        <h3 className="text-lg font-medium text-gray-200 mt-6 mb-3">For EU/EEA residents (GDPR):</h3>
        <p className="text-gray-300 mb-2">Our legal basis for processing your data is:</p>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li><strong className="text-white">Contract performance:</strong> we need your data to provide the Service you signed up for</li>
          <li><strong className="text-white">Legitimate interest:</strong> improving the Service based on aggregated usage patterns</li>
        </ul>
        <p className="text-gray-300 mt-3">
          You have the right to lodge a complaint with your local data protection authority.
        </p>

        <h3 className="text-lg font-medium text-gray-200 mt-6 mb-3">For California residents (CCPA):</h3>
        <p className="text-gray-300">
          We do not sell your personal information. You have the right to know
          what data we collect and to request its deletion.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 6 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Cookies and Local Storage</h2>
        <p className="text-gray-300 mb-3">We use <strong className="text-white">browser local storage</strong> (similar to cookies) to:</p>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li>Keep you logged in (authentication tokens)</li>
          <li>Cache your learning progress locally for performance</li>
        </ul>
        <p className="text-gray-300 mt-3">
          We do <strong className="text-white">not</strong> use tracking cookies, advertising cookies, or
          third-party analytics cookies.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 7 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Security</h2>
        <p className="text-gray-300 mb-3">We take reasonable measures to protect your data:</p>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li>All connections use HTTPS/TLS encryption</li>
          <li>Passwords are hashed using bcrypt (handled by Supabase Auth)</li>
          <li>Payment data is handled entirely by Stripe (PCI-DSS compliant)</li>
          <li>Database access is protected by Row Level Security policies</li>
          <li>Secret keys are stored in server-side environment variables only</li>
        </ul>
        <p className="text-gray-300 mt-3">
          No method of transmission over the internet is 100% secure. We cannot
          guarantee absolute security but we strive to use commercially
          acceptable means to protect your data.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 8 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Children's Privacy</h2>
        <p className="text-gray-300">
          The Service is not intended for children under 13. We do not knowingly
          collect personal information from children under 13. If you believe a
          child has provided us with personal data, please contact us and we
          will delete it.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 9 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. Changes to This Policy</h2>
        <p className="text-gray-300">
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes by posting a notice on the Service or
          sending an email. Your continued use of the Service after changes
          constitutes acceptance of the updated policy.
        </p>

        <hr className="border-neutral-700 my-8" />

        {/* Section 10 */}
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">10. Contact</h2>
        <p className="text-gray-300">
          If you have any questions about this Privacy Policy, contact us at:
        </p>
        <div className="mt-3 p-4 bg-neutral-800/60 rounded-xl border border-neutral-700">
          <p className="text-white font-semibold">ZhongCang</p>
          <p className="text-gray-300">
            Email:{" "}
            <a href="mailto:zhong@cang.com" className="text-red-400 hover:text-red-300">zhong@cang.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
