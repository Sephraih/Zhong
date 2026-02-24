import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { password } = (req.body ?? {}) as { password?: string };
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (!user.email) {
      return res.status(400).json({ error: "User has no email" });
    }

    // Password confirmation (prevents deletion if token is stolen but attacker doesn't know password)
    const { error: pwError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (pwError) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Best-effort cleanup of public tables (many are ON DELETE CASCADE anyway)
    await supabase.from("user_learned_words").delete().eq("user_id", user.id);
    await supabase.from("purchased_levels").delete().eq("user_id", user.id);
    await supabase.from("subscriptions").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error("[delete-account] admin.deleteUser error:", delError);
      return res.status(500).json({ error: "Failed to delete account" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[delete-account] unexpected error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
