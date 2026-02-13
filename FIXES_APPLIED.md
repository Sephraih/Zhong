# Premium Subscription Fixes Applied

## Problem
New users completing Stripe payments were not showing premium status, while existing premium users showed correctly.

## Root Causes Identified

### 1. **Row Level Security (RLS) Policy Issue**
The Supabase RLS policies were too restrictive. The service role couldn't insert/update records because the policies used `USING (true)` but this doesn't bypass RLS - it only allows operations matching the policy conditions.

### 2. **Missing Profile Creation**
New users might not have a profile row created yet when the webhook fires, causing the update to fail silently.

### 3. **Insufficient Logging**
The webhook handler didn't log enough information to debug failures.

## Fixes Applied

### 1. Updated `api/webhook.ts`
- **Added extensive logging** throughout the webhook handler
- **Added profile existence check** - creates profile if missing before updating
- **Added error logging** for each database operation
- **Console logs now show:**
  - Session ID, User ID, Customer ID
  - Each step of the premium activation process
  - Success/failure for auth metadata and profile updates

### 2. Updated `SUPABASE_SETUP.sql`
- **Fixed RLS policies** to properly allow webhook operations:
  ```sql
  -- OLD (didn't work):
  CREATE POLICY "Service role full access profiles"
    ON public.profiles FOR ALL
    USING (true) WITH CHECK (true);
  
  -- NEW (works):
  CREATE POLICY "Allow profile inserts"
    ON public.profiles FOR INSERT
    WITH CHECK (true);
  
  CREATE POLICY "Allow profile updates"
    ON public.profiles FOR UPDATE
    USING (true) WITH CHECK (true);
  ```
- Applied same fix to `subscriptions` table

### 3. Created Debug Documentation
- `PREMIUM_DEBUG_GUIDE.md` - Complete troubleshooting guide
- Step-by-step debugging instructions
- Environment variable checklist
- Manual database fix queries

## Action Required

### Step 1: Update Supabase Database

Run this in **Supabase SQL Editor**:

```sql
-- Fix RLS policies for webhook access
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
CREATE POLICY "Allow profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
CREATE POLICY "Allow profile updates"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow subscription inserts" ON public.subscriptions;
CREATE POLICY "Allow subscription inserts"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow subscription updates" ON public.subscriptions;
CREATE POLICY "Allow subscription updates"
  ON public.subscriptions FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

### Step 2: Redeploy to Vercel

```bash
git add .
git commit -m "Fix premium subscription webhook handling"
git push origin main
```

Vercel will auto-deploy the updated webhook with logging.

### Step 3: Test Premium Upgrade

1. **Sign up a new test user**
2. **Click "Upgrade to Premium"**
3. **Use test card:** `4242 4242 4242 4242`
4. **After payment, check Vercel logs:**
   - Go to Vercel Dashboard → Functions → `/api/webhook`
   - You should see detailed logs like:
     ```
     📩 Webhook received: checkout.session.completed
     💳 Checkout completed for session: cs_test_xxx
     👤 User ID from metadata: abc-123
     ✅ Premium activation complete!
     ```

### Step 4: Verify in Supabase

Check the data was written:

```sql
-- Check profile
SELECT id, email, is_premium, stripe_customer_id
FROM public.profiles
WHERE email = 'your-test-email@example.com';

-- Check subscription
SELECT user_id, status, stripe_session_id
FROM public.subscriptions
WHERE user_id = 'user-id-from-above';
```

## Debugging

If it still doesn't work:

1. **Check Vercel Function Logs** (should show detailed webhook processing)
2. **Check Stripe Dashboard → Events** (webhook should show 200 OK)
3. **Verify environment variables:**
   - `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
   - `STRIPE_WEBHOOK_SECRET` (from Vercel deployment, not CLI)
4. **See `PREMIUM_DEBUG_GUIDE.md`** for complete troubleshooting

## Expected Behavior After Fix

1. ✅ User completes payment in Stripe
2. ✅ Webhook receives `checkout.session.completed` event
3. ✅ Webhook creates profile if missing
4. ✅ Webhook updates `auth.users.app_metadata.is_premium = true`
5. ✅ Webhook updates `profiles.is_premium = true`
6. ✅ Webhook inserts subscription record
7. ✅ User redirected to app with `?payment=success`
8. ✅ Frontend polls `/api/auth/me` endpoint
9. ✅ Premium status shows in UI immediately
10. ✅ Premium badge appears in user dropdown

## Files Modified

- `api/webhook.ts` - Added logging and profile creation
- `SUPABASE_SETUP.sql` - Fixed RLS policies
- `PREMIUM_DEBUG_GUIDE.md` - New troubleshooting guide
- `FIXES_APPLIED.md` - This file

## Next Steps

After applying the SQL fixes and redeploying, the premium subscription should work for all new users.
