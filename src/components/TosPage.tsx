interface TosPageProps {
  onBack: () => void;
}

export function TosPage({ onBack }: TosPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
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
          These Terms of Service ("Terms") govern your use of ZhongCang
          (the "Service") operated by ZhongCang ("we", "us", "our").
        </p>

        <p className="text-gray-300 mb-8">
          By creating an account or using the Service, you agree to these Terms.
          If you do not agree, do not use the Service.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. The Service</h2>
        <p className="text-gray-300">
          ZhongCang is a language learning application that helps users study
          Chinese vocabulary organized by HSK levels. The Service includes both
          free and paid features.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Accounts</h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>You must provide a valid email address to create an account.</li>
          <li>You are responsible for maintaining the security of your account and password.</li>
          <li>You must be at least 13 years old to use the Service.</li>
          <li>One person may not maintain more than one account.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Acceptable Use</h2>
        <p className="text-gray-300 mb-3">You agree NOT to:</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to the Service or its systems</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Scrape, copy, or redistribute the Service's content</li>
          <li>Share your account credentials with others</li>
          <li>Use automated tools (bots) to access the Service</li>
          <li>Resell or redistribute access to the Service</li>
        </ul>
        <p className="text-gray-300">
          We reserve the right to suspend or terminate accounts that violate these terms.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Paid Features</h2>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Pricing:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>Additional HSK levels and Premium access are available through one-time purchases.</li>
          <li>Payment is processed securely by Stripe. We do not store your payment card details.</li>
          <li>Prices are listed on the Service and may change with notice.</li>
          <li>All purchases grant permanent access to the purchased content.</li>
        </ul>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Refunds:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            If you are unsatisfied with the Service, you may request a full
            refund within <strong>7 days</strong> of your purchase by contacting us at{" "}
            <a href="mailto:zhong@cang.com" className="text-red-400 hover:text-red-300">
              zhong@cang.com
            </a>.
          </li>
          <li>After the 7-day period, refunds are provided at our discretion.</li>
          <li>Refund requests are typically processed within 5–10 business days.</li>
        </ul>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">EU right of withdrawal:</h3>
        <p className="text-gray-300">
          If you are in the EU/EEA, you have a 14-day right of withdrawal
          from the date of purchase. By using the premium features
          immediately upon purchase, you acknowledge and agree that you
          waive this right of withdrawal once the digital content has been
          accessed.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Intellectual Property</h2>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Our content:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
          <li>
            The Service, including its design, code, text, and educational
            content, is owned by ZhongCang and protected by copyright
            and other intellectual property laws.
          </li>
          <li>
            You may not copy, modify, distribute, or create derivative works
            from our content without written permission.
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-white mt-6 mb-3">Your data:</h3>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>You retain ownership of your personal data and learning progress.</li>
          <li>
            You grant us a limited license to store and process your data
            solely for the purpose of providing the Service.
          </li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Availability and Warranties</h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>
            The Service is provided "as is" and "as available" without
            warranties of any kind, either express or implied.
          </li>
          <li>
            We do not guarantee that the Service will be uninterrupted,
            error-free, or free of harmful components.
          </li>
          <li>
            We do not warrant that the educational content is complete,
            accurate, or suitable for any particular purpose.
          </li>
          <li>
            We may modify, suspend, or discontinue the Service (or any part
            of it) at any time with reasonable notice.
          </li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Limitation of Liability</h2>
        <p className="text-gray-300 mb-3">To the maximum extent permitted by law:</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>
            We shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of
            the Service.
          </li>
          <li>
            Our total liability for any claim related to the Service shall
            not exceed the amount you paid us in the 12 months preceding
            the claim.
          </li>
          <li>
            This limitation applies regardless of the theory of liability
            (contract, tort, or otherwise).
          </li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Your Data Rights</h2>
        
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 my-6">
          <p className="text-gray-300 text-sm">
            <strong className="text-white">📥 Self-Service Data Management:</strong> You can download all your
            data (profile, learning progress, purchases) anytime from your{" "}
            <strong>Profile → Your Data → Export My Data</strong> button. You can also delete
            your account entirely from <strong>Profile → Danger zone</strong>. No need to contact us.
          </p>
        </div>

        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>
            You may delete your account at any time from your profile settings.
          </li>
          <li>
            Upon deletion, all your personal data and learning progress will
            be permanently removed from our systems.
          </li>
          <li>
            Data held by third parties (Stripe payment records) may be retained
            as required by law.
          </li>
          <li>Account deletion is irreversible.</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">9. Changes to These Terms</h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>We may update these Terms from time to time.</li>
          <li>
            We will notify you of significant changes via email or a
            prominent notice on the Service.
          </li>
          <li>
            Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </li>
          <li>If you disagree with updated Terms, you may delete your account.</li>
        </ul>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">10. Governing Law</h2>
        <p className="text-gray-300">
          These Terms are governed by the laws of Germany.
          Any disputes arising from these Terms or the Service shall be
          resolved in the courts of Germany.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">11. Severability</h2>
        <p className="text-gray-300">
          If any provision of these Terms is found to be unenforceable,
          the remaining provisions shall remain in full effect.
        </p>

        <hr className="border-neutral-700 my-8" />

        <h2 className="text-xl font-bold text-white mt-8 mb-4">12. Contact</h2>
        <p className="text-gray-300">
          If you have any questions about these Terms, contact us at:
        </p>
        <div className="mt-4 p-4 bg-neutral-800/50 rounded-xl">
          <p className="text-white font-semibold">ZhongCang</p>
          <p className="text-gray-300">
            Email:{" "}
            <a href="mailto:zhong@cang.com" className="text-red-400 hover:text-red-300">
              zhong@cang.com
            </a>
          </p>
          <p className="text-gray-300">
            Website:{" "}
            <a href="https://zhong-theta.vercel.app" className="text-red-400 hover:text-red-300">
              zhong-theta.vercel.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
