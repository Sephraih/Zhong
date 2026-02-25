interface TosPageProps {
  onBack: () => void;
}

const LAST_UPDATED = "February 2025";
const APP_NAME = "ZhongCang";
const SERVICE_URL = "https://zhong-theta.vercel.app";
const CONTACT_EMAIL = "zhong@cang.com";

export function TosPage({ onBack }: TosPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
      >
        ← Back
      </button>

      <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-lg prose prose-invert prose-sm max-w-none \
prose-headings:text-white prose-strong:text-white prose-p:text-gray-300 prose-li:text-gray-300 \
prose-hr:border-neutral-700 prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline \
prose-h2:mt-8 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2 prose-ul:my-3 prose-ul:space-y-1">
        <h1>Terms of Service</h1>
        <p>
          <strong>Last updated:</strong> {LAST_UPDATED}
        </p>

        <p>
          These Terms of Service ("Terms") govern your use of {APP_NAME} (the "Service") operated by {APP_NAME}
          ("we", "us", "our").
        </p>

        <p>
          By creating an account or using the Service at <a href={SERVICE_URL}>{SERVICE_URL}</a>, you agree to these
          Terms. If you do not agree, do not use the Service.
        </p>

        <hr />

        <h2>1. The Service</h2>
        <p>
          {APP_NAME} is a language learning application that helps users study Chinese vocabulary organized by HSK
          levels. The Service includes both free and paid features.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You must provide a valid email address to create an account.</li>
          <li>You are responsible for maintaining the security of your account and password.</li>
          <li>You must be at least 13 years old to use the Service.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
        </ul>

        <h2>3. Acceptable Use</h2>
        <p>You agree NOT to:</p>
        <ul>
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to the Service or its systems</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Scrape, copy, or redistribute the Service’s content</li>
          <li>Share your account credentials with others</li>
          <li>Use automated tools (bots) to access the Service</li>
          <li>Resell or redistribute access to the Service</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>

        <h2>4. Paid Features (One-Time Unlocks)</h2>
        <p>
          The Service may offer paid features as one-time purchases, such as unlocking additional HSK levels or a
          premium bundle.
        </p>

        <h3>Billing</h3>
        <ul>
          <li>Paid features are purchased as <strong>one-time payments</strong> (not subscriptions).</li>
          <li>Payment is processed securely by Stripe. We do not store your payment card details.</li>
          <li>Prices are displayed at checkout and may change over time.</li>
        </ul>

        <h3>Refunds</h3>
        <ul>
          <li>
            If you are unsatisfied with the Service, you may request a refund within <strong>7 days</strong> of your purchase by
            contacting us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </li>
          <li>After the 7-day period, refunds are provided at our discretion.</li>
          <li>Refund requests are typically processed within 5–10 business days (depending on Stripe/bank processing).</li>
        </ul>

        <h3>EU right of withdrawal</h3>
        <p>
          If you are in the EU/EEA, you may have a 14-day right of withdrawal. By using the digital features
          immediately upon purchase, you acknowledge that this right may be waived once the digital content has been
          accessed.
        </p>

        <h2>5. Intellectual Property</h2>
        <h3>Our content</h3>
        <ul>
          <li>
            The Service, including its design, code, text, and educational content, is owned by {APP_NAME} and
            protected by copyright and other intellectual property laws.
          </li>
          <li>You may not copy, modify, distribute, or create derivative works from our content without permission.</li>
        </ul>

        <h3>Your data</h3>
        <ul>
          <li>You retain ownership of your personal data and learning progress.</li>
          <li>
            You grant us a limited license to store and process your data solely for the purpose of providing the
            Service.
          </li>
        </ul>

        <h2>6. Availability and Warranties</h2>
        <ul>
          <li>The Service is provided “as is” and “as available” without warranties of any kind.</li>
          <li>We do not guarantee that the Service will be uninterrupted, error-free, or free of harmful components.</li>
          <li>
            We do not warrant that the educational content is complete, accurate, or suitable for any particular
            purpose.
          </li>
          <li>We may modify, suspend, or discontinue the Service (or any part of it) at any time.</li>
        </ul>

        <h2>7. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
          <li>
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from
            your use of the Service.
          </li>
          <li>
            Our total liability for any claim related to the Service shall not exceed the amount you paid us in the 12
            months preceding the claim.
          </li>
        </ul>

        <h2>8. Account Deletion</h2>
        <ul>
          <li>You may delete your account at any time from your profile settings.</li>
          <li>
            Upon deletion, your personal data and learning progress will be permanently removed from our systems.
          </li>
          <li>
            Data held by third parties (e.g., Stripe payment records) may be retained as required by law.
          </li>
          <li>Account deletion is irreversible.</li>
        </ul>

        <h2>9. Changes to These Terms</h2>
        <ul>
          <li>We may update these Terms from time to time.</li>
          <li>
            We will notify you of significant changes by posting a notice on the Service or sending an email (where
            applicable).
          </li>
          <li>Continued use of the Service after changes constitutes acceptance of the new Terms.</li>
          <li>If you disagree with updated Terms, you may delete your account.</li>
        </ul>

        <h2>10. Governing Law</h2>
        <p>
          These Terms are governed by the laws of your jurisdiction unless otherwise required by applicable law.
        </p>

        <h2>11. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full
          effect.
        </p>

        <hr />

        <h2>Contact</h2>
        <p>
          If you have any questions about these Terms, contact us at: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
