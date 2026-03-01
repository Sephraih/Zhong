import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Max size for learned_bits JSON (10KB)
const MAX_LEARNED_BITS_SIZE = 10 * 1024;

// Valid HSK levels
const VALID_HSK_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Base64 character validation regex
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function validateLearnedBits(learnedBits: unknown): { valid: boolean; error?: string } {
  // Must be an object
  if (typeof learnedBits !== 'object' || learnedBits === null || Array.isArray(learnedBits)) {
    return { valid: false, error: 'learned_bits must be a JSON object' };
  }

  // Check overall size
  const jsonStr = JSON.stringify(learnedBits);
  if (jsonStr.length > MAX_LEARNED_BITS_SIZE) {
    return { valid: false, error: `learned_bits exceeds maximum size of ${MAX_LEARNED_BITS_SIZE} bytes` };
  }

  // Validate each key-value pair
  for (const [key, value] of Object.entries(learnedBits)) {
    // Key must be a valid HSK level (1-9)
    if (!VALID_HSK_LEVELS.includes(key)) {
      return { valid: false, error: `Invalid HSK level key: ${key}. Must be 1-9.` };
    }

    // Value must be a string (base64 encoded)
    if (typeof value !== 'string') {
      return { valid: false, error: `Value for HSK level ${key} must be a string` };
    }

    // Value should be valid base64
    if (value.length > 0 && !BASE64_REGEX.test(value)) {
      return { valid: false, error: `Value for HSK level ${key} is not valid base64` };
    }

    // Individual value size limit (2KB per level is plenty)
    if (value.length > 2048) {
      return { valid: false, error: `Value for HSK level ${key} exceeds maximum length` };
    }
  }

  return { valid: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate user
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET: Fetch learned progress
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('user_learned_words')
        .select('learned_bits, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching learned progress:', error);
        return res.status(500).json({ error: 'Failed to fetch progress' });
      }

      return res.json({
        learned_bits: data?.learned_bits || {},
        updated_at: data?.updated_at || null,
      });
    } catch (error) {
      console.error('Error in GET learned-progress:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST: Save learned progress
  if (req.method === 'POST') {
    try {
      const { learned_bits } = req.body;

      // Validate the learned_bits structure
      const validation = validateLearnedBits(learned_bits);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Upsert the learned progress
      const { error } = await supabase
        .from('user_learned_words')
        .upsert(
          { 
            user_id: user.id, 
            learned_bits,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving learned progress:', error);
        return res.status(500).json({ error: 'Failed to save progress' });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error in POST learned-progress:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
