import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type UpdateType = "email" | "password";

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

    const { type, current_password, new_email, new_password } = (req.body ?? {}) as {
      type?: UpdateType;
      current_password?: string;
      new_email?: string;
      new_password?: string;
    };

    if (type !== "email" && type !== "password") {
      return res.status(400).json({ error: "type must be 'email' or 'password'" });
    }

    if (!current_password || typeof current_password !== "string") {
      return res.status(400).json({ error: "current_password is required" });
    }

    if (!user.email) {
      return res.status(400).json({ error: "User has no email" });
    }

    // Password confirmation (prevents account takeovers via stolen JWT)
    const { error: pwError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });
    if (pwError) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    if (type === "email") {
      if (!new_email || typeof new_email !== "string") {
        return res.status(400).json({ error: "new_email is required" });
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email: new_email,
      });
      if (updateError) {
        console.error("[update-account] update email error:", updateError);
        return res.status(500).json({ error: "Failed to update email" });
      }

      // Keep profiles.email in sync (best-effort)
      await supabase.from("profiles").update({ email: new_email }).eq("id", user.id);

      return res.status(200).json({ success: true });
    }

    // type === "password"
    if (!new_password || typeof new_password !== "string" || new_password.length < 6) {
      return res.status(400).json({ error: "new_password must be at least 6 characters" });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: new_password,
    });
    if (updateError) {
      console.error("[update-account] update password error:", updateError);
      return res.status(500).json({ error: "Failed to update password" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[update-account] unexpected error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
