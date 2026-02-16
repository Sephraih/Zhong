import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripe_price_id: process.env.STRIPE_PRICE_ID ? 'configured' : 'not set',
    supabase_url: process.env.SUPABASE_URL ? 'configured' : 'not set',
  });
}
