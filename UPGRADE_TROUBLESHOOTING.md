# Upgrade to Premium - Troubleshooting Guide

## What Was Fixed

### 1. **AuthHeader Bug** ✅
- **Issue**: The "Upgrade to Premium" button was calling `useAuth().startCheckout()` which created a new hook instance instead of using the existing context
- **Fix**: Now properly destructures `startCheckout` from the existing `useAuth()` hook and calls it directly

### 2. **Backend Stripe Initialization** ✅
- **Issue**: Stripe webhook handler was defined before the `stripe` client was initialized
- **Fix**: Moved Stripe initialization to the top of the file, before any route handlers

### 3. **Added Debug Logging** ✅
- Added console logs to the checkout endpoint to help debug issues

---

## Testing the Upgrade Flow

### Step 1: Ensure Backend is Running
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4242
📚 Supabase URL: https://your-project.supabase.co
```

### Step 2: Ensure Frontend is Running
```bash
npm run dev
```

### Step 3: Sign In
1. Go to http://localhost:5173
2. Click "Sign In" and log in with your account

### Step 4: Click "Upgrade to Premium"
1. Click your avatar in the top right
2. Click "Upgrade to Premium"
3. Watch the backend terminal for logs:

**Expected logs:**
```
🛒 Checkout session request received
✅ User authenticated: your-email@example.com
✅ Created checkout session for user: your-email@example.com
```

**If you see errors:**
- `❌ No authorization header` → Frontend is not sending the token. Check browser console for errors.
- `❌ User authentication failed` → Token is invalid. Try logging out and back in.

### Step 5: Stripe Checkout
- You should be redirected to a Stripe Checkout page
- Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
- After successful payment, you'll be redirected back to the app

### Step 6: Verify Premium Status
- The webhook will update your user's `app_metadata.is_premium` to `true`
- Your dropdown should now show "⭐ Premium" instead of "Free"
- The "Upgrade to Premium" button should disappear

---

## Common Issues

### "Button doesn't do anything"
**Check:**
1. Open browser console (F12) → Check for JavaScript errors
2. Open Network tab → Click the button → Look for a request to `/api/create-checkout-session`
3. If no request is made → Check if the button's `onClick` handler is firing

**Solution:**
- Make sure you're logged in
- Clear browser cache and refresh
- Check that `VITE_API_BASE` in `.env` matches your backend URL

### "CORS error"
**Solution:**
- Make sure backend is running on port 4242
- Check that backend's CORS is enabled (it should be: `app.use(cors())`)

### "401 Unauthorized"
**Solution:**
- Token might be expired. Log out and log back in.
- Check that the token is being saved to localStorage after login
- Verify Supabase credentials in `backend/.env`

### "Webhook not working"
**For local testing, you need Stripe CLI:**
```bash
stripe listen --forward-to localhost:4242/api/webhook
```

This will give you a webhook secret like `whsec_xxx`. Add it to `backend/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Environment Variables Checklist

### Frontend `.env`
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co       # ✅ Filled
VITE_SUPABASE_ANON_KEY=eyJxxx...                # ✅ Filled
VITE_API_BASE=http://localhost:4242             # ✅ Correct
```

### Backend `backend/.env`
```bash
SUPABASE_URL=https://xxx.supabase.co            # ✅ Filled
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...             # ✅ Filled (service_role, not anon!)
PORT=4242                                       # ✅ Correct
STRIPE_SECRET_KEY=sk_test_xxx                   # ✅ Filled (from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=whsec_xxx                 # ✅ Filled (from `stripe listen`)
FRONTEND_URL=http://localhost:5173              # ✅ Correct
```

---

## Next Steps

Once the upgrade flow works locally, you can:
1. Deploy the backend to a service like Railway, Render, or Fly.io
2. Update `VITE_API_BASE` in production `.env` to point to your deployed backend
3. Set up a production Stripe webhook pointing to `https://your-backend.com/api/webhook`
4. Replace `sk_test_` with your live Stripe key for production
