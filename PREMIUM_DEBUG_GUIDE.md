# Premium Subscription Debugging Guide

## Issue: New users don't show premium status after payment

### Step 1: Update Supabase RLS Policies

The issue is likely that the webhook can't update the database due to Row Level Security policies.

**Run this in Supabase SQL Editor:**

```sql
-- Fix RLS policies to allow webhook updates
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

### Step 2: Verify Stripe Webhook is Working

**Check Vercel Function Logs:**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `/api/webhook`
3. Look for logs after completing a payment

**Expected logs:**
```
📩 Webhook received: checkout.session.completed
💳 Checkout completed for session: cs_test_xxx
👤 User ID from metadata: abc-123-xyz
🆔 Customer ID: cus_xxx
🔧 Updating premium status for user abc-123-xyz to true
✅ Auth metadata updated
✅ Profile updated
💾 Inserting subscription record...
✅ Premium activation complete!
```

**If you see errors:**
- `❌ No user_id in session metadata!` → Checkout session not passing user_id
- `❌ Profile update error` → RLS policy issue (run SQL above)
- `❌ Auth metadata update error` → Check SUPABASE_SERVICE_ROLE_KEY env var

### Step 3: Check Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Find your webhook endpoint (`https://your-app.vercel.app/api/webhook`)
3. Click on it → Check "Events" tab
4. Recent events should show:
   - `checkout.session.completed` with status `200 OK`

**If webhook isn't receiving events:**
- Verify the endpoint URL is correct
- Check if webhook secret matches `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 4: Test Stripe Webhook Manually

**Using Stripe CLI:**
```bash
# Forward webhooks to your Vercel deployment
stripe listen --forward-to https://your-app.vercel.app/api/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

Watch the output for errors.

### Step 5: Check Supabase Database

**Query the profiles table:**
```sql
SELECT id, email, is_premium, stripe_customer_id, updated_at
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 10;
```

**Query the subscriptions table:**
```sql
SELECT user_id, stripe_session_id, status, created_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 10;
```

**After a successful payment, you should see:**
- Profile with `is_premium = true`
- Subscription record with `status = 'active'`

### Step 6: Verify Environment Variables

**In Vercel Dashboard → Settings → Environment Variables:**

| Variable | Format | Example |
|----------|--------|---------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | **Service role** (not anon!) |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Test mode secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From webhook endpoint |
| `STRIPE_PRICE_ID` | `price_...` | Your subscription price |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel URL |

**Common mistakes:**
- Using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- Using production keys in test mode (or vice versa)
- Webhook secret from local Stripe CLI instead of dashboard

### Step 7: Manual Database Fix (If Needed)

If a user paid but doesn't have premium, you can manually fix it:

```sql
-- Replace 'user-id-here' with actual user ID
UPDATE public.profiles
SET is_premium = true
WHERE id = 'user-id-here';

-- Also update auth metadata
-- (This requires running from backend with service role key)
```

### Step 8: Frontend Refresh

The frontend auto-refreshes premium status when:
1. Returning from Stripe payment (`?payment=success` in URL)
2. Tab becomes visible (focus event)
3. Manually calling `refreshAuth()`

**Force refresh in browser console:**
```javascript
localStorage.getItem('hanyu_auth_token') // Should exist
location.href = '/?payment=success' // Triggers refresh
```

---

## Quick Checklist

- [ ] Run updated SQL in Supabase to fix RLS policies
- [ ] Verify Stripe webhook endpoint in dashboard
- [ ] Check webhook secret matches Vercel env var
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
- [ ] Test payment and check Vercel function logs
- [ ] Check Stripe dashboard for successful webhook delivery
- [ ] Query Supabase database to verify data was written
- [ ] Redeploy after fixing environment variables

---

## Still Having Issues?

1. **Create a test user**
2. **Complete a payment**
3. **Check these logs in order:**
   - Vercel → Functions → `/api/create-checkout-session` (checkout created?)
   - Stripe Dashboard → Events (webhook fired?)
   - Vercel → Functions → `/api/webhook` (webhook processed?)
   - Supabase → Table Editor → `profiles` (data updated?)
4. **Share the logs** to identify where it's failing
