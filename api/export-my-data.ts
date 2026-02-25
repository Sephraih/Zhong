import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [profileRes, purchasesRes, learnedRes, subsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabaseAdmin
        .from("purchased_levels")
        .select("hsk_level,purchased_at,stripe_payment_id")
        .eq("user_id", user.id)
        .order("hsk_level", { ascending: true }),
      supabaseAdmin
        .from("user_learned_words")
        .select("learned_bits,created_at,updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        user_id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profileRes.data ?? null,
      purchased_levels: purchasesRes.data ?? [],
      learned_state: learnedRes.data ?? null,
      subscriptions_legacy: subsRes.data ?? [],
    };

    const filename = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    return res.status(200).json(exportData);
  } catch (err) {
    console.error("[export-my-data] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
