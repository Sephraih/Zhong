import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env FIRST before anything else
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Validate environment variables ─────────────────────────────
const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
];

for (const key of requiredEnv) {
  if (!process.env[key] || process.env[key]!.includes("your-") || process.env[key]!.includes("your_")) {
    console.error(`❌ Missing or placeholder value for ${key} in backend/.env`);
    process.exit(1);
  }
}

// ─── Initialize clients ─────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 4242;

const app = express();

// ─── CORS ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ─── Helper: extract & verify user from JWT ──────────────────────
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

// ─── Helper: get or create Stripe customer ──────────────────────
async function getOrCreateStripeCustomer(userId: string, email: string) {
  // Check if we already have a stripe_customer_id in the profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  // Save the Stripe customer ID to the profiles table
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  console.log(`✅ Created Stripe customer ${customer.id} for user ${email}`);
  return customer.id;
}

// ─── Helper: update premium status in both auth and profiles ─────
async function setUserPremium(userId: string, isPremium: boolean) {
  // 1. Update auth metadata (affects JWT)
  const { error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      app_metadata: { is_premium: isPremium },
    }
  );

  if (authError) {
    console.error("❌ Failed to update auth metadata:", authError.message);
  } else {
    console.log(`✅ Auth metadata updated: is_premium = ${isPremium}`);
  }

  // 2. Update profiles table (for database queries)
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ is_premium: isPremium })
    .eq("id", userId);

  if (dbError) {
    console.error("❌ Failed to update profiles table:", dbError.message);
  } else {
    console.log(`✅ Profiles table updated: is_premium = ${isPremium}`);
  }
}

// ═════════════════════════════════════════════════════════════════
// STRIPE WEBHOOK — must be before express.json() middleware
// ═════════════════════════════════════════════════════════════════
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    if (!sig) {
      console.error("❌ No stripe-signature header");
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📩 Webhook received: ${event.type}`);

    try {
      switch (event.type) {
        // ─── Checkout completed ──────────────────────────────
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.user_id;

          if (!userId) {
            console.error("❌ No user_id in session metadata");
            break;
          }

          console.log(`🛒 Checkout completed for user: ${userId}`);

          // Update premium status
          await setUserPremium(userId, true);

          // Record subscription in database
          const { error: subError } = await supabase
            .from("subscriptions")
            .insert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string || null,
              stripe_price_id: STRIPE_PRICE_ID,
              stripe_session_id: session.id,
              status: "active",
              current_period_start: new Date().toISOString(),
            });

          if (subError) {
            console.error("❌ Failed to insert subscription:", subError.message);
          } else {
            console.log(`✅ Subscription record created for user ${userId}`);
          }
          break;
        }

        // ─── Subscription cancelled or expired ───────────────
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          // Find user by stripe_customer_id
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await setUserPremium(profile.id, false);

            await supabase
              .from("subscriptions")
              .update({ status: "cancelled" })
              .eq("stripe_customer_id", customerId)
              .eq("status", "active");

            console.log(`✅ Premium revoked for user ${profile.id}`);
          }
          break;
        }

        // ─── Subscription updated (e.g. renewal) ────────────
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            const isActive = subscription.status === "active" || subscription.status === "trialing";
            await setUserPremium(profile.id, isActive);

            await supabase
              .from("subscriptions")
              .update({
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("stripe_customer_id", customerId)
              .eq("status", "active");

            console.log(`✅ Subscription updated for user ${profile.id}: ${subscription.status}`);
          }
          break;
        }

        // ─── Payment failed ─────────────────────────────────
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          console.log(`⚠️ Payment failed for customer ${customerId}`);

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await setUserPremium(profile.id, false);
            await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("stripe_customer_id", customerId);
            console.log(`⚠️ Premium set to false due to payment failure for ${profile.id}`);
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          console.log(`✅ Payment succeeded for customer ${customerId}`);

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await setUserPremium(profile.id, true);
            await supabase
              .from("subscriptions")
              .update({ status: "active" })
              .eq("stripe_customer_id", customerId);
            console.log(`✅ Premium re-activated for ${profile.id}`);
          }
          break;
        }

        case "customer.subscription.trial_will_end": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`⏳ Trial ending for subscription ${subscription.id}`);
          break;
        }

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error("❌ Webhook handler error:", error);
    }

    res.json({ received: true });
  }
);

// ─── JSON body parser (after webhook route) ──────────────────────
app.use(express.json());

// ═════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════════

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(401).json({ error: error.message });

    // Fetch premium status from profiles table
    let isPremium = false;
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", data.user.id)
        .single();
      isPremium = profile?.is_premium || false;
    }

    res.json({
      user: data.user,
      session: data.session,
      is_premium: isPremium,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/logout", async (_req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════
// GET CURRENT USER + PREMIUM STATUS
// ═════════════════════════════════════════════════════════════════
app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check premium status from BOTH sources
    // 1. Auth metadata (set by webhook)
    const authPremium = user.app_metadata?.is_premium === true;

    // 2. Profiles table (more reliable for persistence)
    let dbPremium = false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      dbPremium = profile.is_premium === true;
    }

    // User is premium if EITHER source says so
    const isPremium = authPremium || dbPremium;

    res.json({
      user,
      is_premium: isPremium,
      stripe_customer_id: profile?.stripe_customer_id || null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════
// STRIPE CHECKOUT — uses your Stripe product's Price ID
// ═════════════════════════════════════════════════════════════════
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    console.log("🛒 Checkout session request received");

    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      console.log("❌ User not authenticated");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`✅ User authenticated: ${user.email}`);

    // Get or create a Stripe customer (links Supabase user to Stripe)
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email || ""
    );

    console.log(`✅ Stripe customer: ${customerId}`);

    // Create checkout session using your Stripe Price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${FRONTEND_URL}/?payment=success`,
      cancel_url: `${FRONTEND_URL}/?payment=cancelled`,
      metadata: {
        user_id: user.id,
      },
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error("❌ Checkout error:", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════
// SUBSCRIPTION STATUS (for premium management page)
// ═════════════════════════════════════════════════════════════════
app.get("/api/subscription", async (req, res) => {
  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, stripe_customer_id")
      .eq("id", user.id)
      .single();

    res.json({
      is_premium: profile?.is_premium || false,
      subscription: subscriptions?.[0] || null,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Health check ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stripe_price_id: STRIPE_PRICE_ID,
  });
});

// ─── Start server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`💳 Stripe Price ID: ${STRIPE_PRICE_ID}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
});
