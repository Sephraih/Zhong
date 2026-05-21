import type { VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = new Set(
  ['https://hamhao.com', 'https://www.hamhao.com', process.env.FRONTEND_URL].filter(Boolean) as string[]
);

export function setCors(res: VercelResponse, origin: string | undefined) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
