import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { storageSetItem } from "../utils/storageConsent";

function getBaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  // Ephemeral client: do not persist Supabase session; we only want the access token.
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function parseParams() {
  const url = new URL(window.location.href);
  const search = url.searchParams;

  // Some providers put tokens in hash fragment
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  const get = (k: string) => search.get(k) || hashParams.get(k);

  return {
    code: get("code"),
    accessToken: get("access_token"),
    tokenHash: get("token_hash") || get("token"),
    type: get("type"),
  };
}

export function AuthCallbackPage() {
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState<string>("Confirming your email…");

  useEffect(() => {
    const run = async () => {
      try {
        const { code, accessToken, tokenHash, type } = parseParams();

        // If the redirect contains an access token already, just use it.
        if (accessToken) {
          storageSetItem("hanyu_auth_token", accessToken);
          sessionStorage.setItem("hamhao_email_confirmed", "1");
          setStatus("done");
          setMessage("Email confirmed! Redirecting to your profile…");
          setTimeout(() => window.location.assign("/profile"), 600);
          return;
        }

        const supabase = getBaseClient();
        if (!supabase) {
          setStatus("error");
          setMessage("Supabase is not configured. Please try again later.");
          return;
        }

        // Newer Supabase email confirmation flow can send token_hash + type
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash: tokenHash,
          });

          if (error || !data?.session?.access_token) {
            setStatus("error");
            setMessage(error?.message || "Failed to verify confirmation token.");
            return;
          }

          storageSetItem("hanyu_auth_token", data.session.access_token);
          sessionStorage.setItem("hamhao_email_confirmed", "1");
          setStatus("done");
          setMessage("Email confirmed! Redirecting to your profile…");
          setTimeout(() => window.location.assign("/profile"), 600);
          return;
        }

        // PKCE flow: code param
        if (!code) {
          setStatus("error");
          setMessage("Missing confirmation code/token. Please try opening the link again.");
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data?.session?.access_token) {
          setStatus("error");
          setMessage(error?.message || "Failed to complete confirmation.");
          return;
        }

        storageSetItem("hanyu_auth_token", data.session.access_token);
        sessionStorage.setItem("hamhao_email_confirmed", "1");

        setStatus("done");
        setMessage("Email confirmed! Redirecting to your profile…");
        setTimeout(() => window.location.assign("/profile"), 600);
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Failed to complete confirmation.");
      }
    };

    run();
  }, []);

  return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <div className="text-5xl mb-4">{status === "error" ? "⚠️" : "📧"}</div>
      <h2 className="text-2xl font-bold text-white mb-2">Email confirmation</h2>
      <p className="text-gray-400 mb-8">{message}</p>

      {status === "error" && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.assign("/")}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-200 hover:bg-neutral-800 transition-colors"
          >
            Go home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
