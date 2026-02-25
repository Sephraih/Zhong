import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

type PriceKey = "premium" | "hsk2" | "hsk3" | "hsk4";

function toDisplayPrice(unitAmount: number | null | undefined, currency: string | null | undefined): string | null {
  if (unitAmount == null || !currency) return null;
  const amount = unitAmount / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (_req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (_req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // If Stripe isn't configured (preview / sandbox), return nulls.
  if (!stripeSecretKey) {
    return res.status(200).json({
      configured: false,
      prices: {
        premium: null,
        hsk2: null,
        hsk3: null,
        hsk4: null,
      } satisfies Record<PriceKey, string | null>,
    });
  }

  const stripe = new Stripe(stripeSecretKey);

  const ids: Record<PriceKey, string | undefined> = {
    premium: process.env.STRIPE_PRICE_PREMIUM,
    hsk2: process.env.STRIPE_PRICE_HSK2,
    hsk3: process.env.STRIPE_PRICE_HSK3,
    hsk4: process.env.STRIPE_PRICE_HSK4,
  };

  const out: Record<PriceKey, string | null> = {
    premium: null,
    hsk2: null,
    hsk3: null,
    hsk4: null,
  };

  try {
    const entries = (Object.entries(ids) as Array<[PriceKey, string | undefined]>).filter(([, v]) => Boolean(v));

    const results = await Promise.all(
      entries.map(async ([key, id]) => {
        const price = await stripe.prices.retrieve(id as string);
        return [key, toDisplayPrice(price.unit_amount, price.currency)] as const;
      })
    );

    results.forEach(([key, display]) => {
      out[key] = display;
    });

    // Cache a bit at the edge; Stripe prices rarely change
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");

    return res.status(200).json({ configured: true, prices: out });
  } catch (e) {
    console.error("[prices] failed to fetch stripe prices", e);
    return res.status(200).json({ configured: true, prices: out });
  }
}
