import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripe_price_id: process.env.STRIPE_PRICE_ID || 'not set',
  });
}
