import { useState, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";

interface SupportPageProps {
  onBack: () => void;
  initialOpenFaqSlug?: string;
}

const FAQ_ITEMS: { slug: string; q: string; a: string; content?: ReactNode }[] = [
  {
    slug: "reset-password",
    q: "How do I reset my password?",
    a: 'Open the login screen and click "Forgot password?" — you\'ll receive a reset link by email. If you\'re already logged in, go to Profile → Change Password.',
  },
  {
    slug: "free-plan",
    q: "What's included in the free plan?",
    a: "Free accounts get full access to the HSK 1 vocabulary list, flashcards, sentence practice, and quiz mode. Premium unlocks HSK 2–6 and any levels added in the future.",
  },
  {
    slug: "upgrade-premium",
    q: "How do I upgrade to Premium?",
    a: "Open your Profile (top-right corner) and click Upgrade to Premium. Payment is a one-time purchase — not a subscription.",
  },
  {
    slug: "platforms",
    q: "What platforms is HamHao available on?",
    a: "HamHao is available on the web at hamhao.com, on iOS via the App Store, and on Android via Google Play. The mobile versions are still in development, but you can send us an email if you would like to become a tester / get early access to the app on either platforms.",
  },
  {
    slug: "export-data",
    q: "I want to know what data you are storing of me - How do I export or delete my data?",
    a: "Go to Profile → scroll to Your Data. You can export a full copy of your account data or permanently delete your account from there.",
  },
  {
    slug: "tts-voice",
    q: "The pronunciation (audio) feature isn't working / I hear no sound",
    a: "",
    content: (
      <div className="pt-3 space-y-4 text-sm text-gray-400 leading-relaxed">
        <p>
          HamHao uses your device's built-in text-to-speech (TTS) engine to read Chinese text
          aloud. On Windows, only English voices are installed by default — you need to add a
          Chinese voice pack. There are two ways to do this:
        </p>

        <div className="bg-neutral-800/60 rounded-xl p-4 space-y-2">
          <p className="text-gray-200 font-medium">Option 1 — Speech Settings</p>
          <p>
            Open <span className="text-gray-200">Settings → Time &amp; language → Speech → Manage voices → Add voices</span>,
            then search for and install <span className="text-gray-200">Chinese (Simplified, China)</span>.
          </p>
        </div>

        <div className="bg-neutral-800/60 rounded-xl p-4 space-y-2">
          <p className="text-gray-200 font-medium">Option 2 — Language &amp; Region <span className="text-gray-500 font-normal">(if Option 1 didn't work)</span></p>
          <p>
            Open <span className="text-gray-200">Settings → Time &amp; language → Language &amp; region → Preferred languages → Add a language</span>,
            then search for and install <span className="text-gray-200">Chinese (Simplified, Mainland China)</span>.
          </p>
          <p>Once the language pack is installed, the Chinese TTS voice becomes available automatically.</p>
        </div>

        <p>After installing via either method, restart your browser and the audio should work.</p>

        <div className="border-t border-neutral-700/60 pt-4 space-y-3">
          <div>
            <p className="text-gray-200 font-medium mb-1">macOS &amp; iOS</p>
            <p>
              Chinese voices are included by default. If audio isn't working, go to{" "}
              <span className="text-gray-200">System Settings → Accessibility → Spoken Content → System Voice</span>{" "}
              and confirm a Chinese voice is available.
            </p>
          </div>
          <div>
            <p className="text-gray-200 font-medium mb-1">Android</p>
            <p>
              Chinese TTS is typically pre-installed. If it's missing, go to{" "}
              <span className="text-gray-200">Settings → General management → Language and input → Text-to-speech</span>{" "}
              and install the Google TTS Chinese language data.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: "billing",
    q: "I have a billing issue — how do I get help?",
    a: "Use the contact form below or email support@hamhao.com directly. Please include your account email and a short description of the issue.",
  },
];

type Platform = "Web" | "iOS" | "Android";

export function SupportPage({ onBack, initialOpenFaqSlug }: SupportPageProps) {
  const { user } = useAuth();

  const [openFaq, setOpenFaq] = useState<number | null>(() => {
    if (!initialOpenFaqSlug) return null;
    const idx = FAQ_ITEMS.findIndex((f) => f.slug === initialOpenFaqSlug);
    return idx >= 0 ? idx : null;
  });
  const faqRef = useRef<HTMLDivElement>(null);

  // Scroll the open FAQ item into view when arriving via a deep link
  useEffect(() => {
    if (initialOpenFaqSlug && faqRef.current) {
      setTimeout(() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [initialOpenFaqSlug]);

  const [email, setEmail] = useState(user?.email ?? "");
  const [platform, setPlatform] = useState<Platform>("Web");
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [opened, setOpened] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      setValidationError("Message must be at least 10 characters.");
      return;
    }
    setValidationError("");
    const subject = encodeURIComponent(`Support [${platform}] from ${email.trim()}`);
    const body = encodeURIComponent(`From: ${email.trim()}\nPlatform: ${platform}\n\n${message.trim()}`);
    window.location.href = `mailto:support@hamhao.com?subject=${subject}&body=${body}`;
    setOpened(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Support</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-lg">
        {/* FAQ */}
        <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              ref={item.slug === initialOpenFaqSlug ? faqRef : undefined}
              className="border border-neutral-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-800/50 transition-colors"
              >
                <span className="text-gray-200 font-medium text-sm">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-3 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-neutral-800/60">
                  {item.content ?? <p className="pt-3">{item.a}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        <hr className="border-neutral-700 my-8" />

        {/* Contact Form */}
        <h2 className="text-xl font-bold text-white mb-2">Contact Support</h2>
        <p className="text-gray-400 text-sm mb-6">
          Can't find an answer above? Send us a message and we'll get back to you at{" "}
          <a href="mailto:support@hamhao.com" className="text-red-400 hover:text-red-300">
            support@hamhao.com
          </a>
          .
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Your email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Platform
              </label>
              <div className="flex gap-3">
                {(["Web", "iOS", "Android"] as Platform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      platform === p
                        ? "bg-red-600 border-red-500 text-white"
                        : "bg-neutral-800 border-neutral-700 text-gray-400 hover:border-neutral-600 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Message
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                rows={5}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all resize-none"
              />
              <p className="text-xs text-gray-600 mt-1">{message.trim().length} / 10 characters minimum</p>
            </div>

            {validationError && (
              <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                {validationError}
              </div>
            )}

            {opened && (
              <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl px-4 py-3 text-gray-400 text-sm">
                Your email client should have opened with the message pre-filled. If it didn't,{" "}
                <a href="mailto:support@hamhao.com" className="text-red-400 hover:text-red-300">
                  email us directly
                </a>
                .
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-2"
            >
              Open Email Client
            </button>
          </form>
      </div>
    </div>
  );
}
