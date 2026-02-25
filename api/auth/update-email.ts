import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { new_email, current_password } = (req.body ?? {}) as {
      new_email?: string;
      current_password?: string;
    };

    if (!new_email || typeof new_email !== "string") {
      return res.status(400).json({ error: "new_email is required" });
    }
    if (!current_password || typeof current_password !== "string") {
      return res.status(400).json({ error: "current_password is required" });
    }

    if (!user.email) {
      return res.status(400).json({ error: "User has no email" });
    }

    // Password confirmation
    const { error: pwError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });
    if (pwError) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Update auth user email
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email: new_email,
    });
    if (updateError) {
      console.error("[update-email] admin.updateUserById error:", updateError);
      return res.status(500).json({ error: "Failed to update email" });
    }

    // Keep profiles.email in sync (best-effort)
    await supabase.from("profiles").update({ email: new_email }).eq("id", user.id);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[update-email] unexpected error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
