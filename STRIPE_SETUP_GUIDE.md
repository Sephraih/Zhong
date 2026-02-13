# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe for premium upgrades in your Chinese Learning App.

---

## Step 1: Get Your Stripe Test API Keys

1. **Sign up for Stripe** (if you haven't already):
   - Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
   - Create a free account

2. **Get your test API keys**:
   - Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
   - Make sure you're in **Test Mode** (toggle in the top right)
   - Copy your **Secret key** (starts with `sk_test_`)

3. **Add to backend/.env**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 2: Set Up Webhook for Local Testing

Stripe needs to notify your server when a payment is successful. For local testing, use the Stripe CLI:

### Install Stripe CLI

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Login to Stripe CLI

```bash
stripe login
```
This will open your browser for authentication.

### Forward Webhooks to Your Local Server

```bash
stripe listen --forward-to localhost:4242/api/webhook
```

**Important:** This command will output a webhook signing secret like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

Copy this secret and add it to `backend/.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Keep this terminal window running** while you test!

---

## Step 3: Complete Environment Setup

### Backend `.env` (backend/.env)
```bash
PORT=4242
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` (project root)
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE=http://localhost:4242
```

---

## Step 4: Start Your Servers

### Terminal 1: Frontend
```bash
npm run dev
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

### Terminal 3: Stripe Webhook Listener
```bash
stripe listen --forward-to localhost:4242/api/webhook
```

---

## Step 5: Test the Premium Upgrade

1. **Open the app**: http://localhost:5173

2. **Sign up / Sign in** with a test account

3. **Click "Upgrade to Premium"** in the user dropdown

4. **You'll be redirected to Stripe Checkout**

5. **Use Stripe test card numbers**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

6. **Complete the payment**

7. **Check the webhook terminal** - You should see:
   ```
   ✅ User {user-id} upgraded to premium
   ```

8. **Refresh the app** - Your avatar should now show "Premium Member"

---

## Step 6: Verify Premium Status

### Option A: Check in the App
- Refresh the page
- Click your avatar - you should see "Premium Member" badge

### Option B: Check Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Find your user
4. Check the **App Metadata** - it should show:
   ```json
   {
     "is_premium": true
   }
   ```

---

## Troubleshooting

### Webhook Not Working
- **Symptom**: Payment succeeds but user not upgraded
- **Solution**: 
  - Make sure `stripe listen` is running
  - Check that `STRIPE_WEBHOOK_SECRET` is set correctly
  - Look for errors in the backend terminal

### Checkout Session Error
- **Symptom**: "Failed to create checkout session"
- **Solution**:
  - Verify `STRIPE_SECRET_KEY` is correct
  - Make sure you're using the **test** key (starts with `sk_test_`)
  - Check backend logs for detailed errors

### CORS Error
- **Symptom**: Network error when clicking "Upgrade"
- **Solution**:
  - Make sure backend is running on port 4242
  - Check that `VITE_API_BASE=http://localhost:4242`

### User Not Found After Payment
- **Symptom**: Webhook receives event but can't find user
- **Solution**:
  - Check that `SUPABASE_SERVICE_ROLE_KEY` is set (not `SUPABASE_SERVICE_KEY`)
  - Verify the service role key has admin permissions

---

## Production Deployment

When you're ready to go live:

1. **Switch to Live Mode** in Stripe Dashboard

2. **Get Live API Keys**:
   - Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - Copy your **Live Secret Key** (starts with `sk_live_`)

3. **Set up Production Webhook**:
   - Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - URL: `https://your-production-domain.com/api/webhook`
   - Events to listen: `checkout.session.completed`
   - Copy the webhook signing secret

4. **Update Production Environment Variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxxxxxxxxxx
   FRONTEND_URL=https://your-production-domain.com
   ```

5. **Test with real cards** in a staging environment first!

---

## Price Configuration

To change the price, edit `backend/src/index.ts`:

```typescript
line_items: [
  {
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Premium Chinese Learning App',
        description: 'Unlock all premium features',
      },
      unit_amount: 999, // $9.99 in cents (change this!)
    },
    quantity: 1,
  },
],
```

For recurring subscriptions, change `mode: 'payment'` to `mode: 'subscription'` and add:
```typescript
price_data: {
  currency: 'usd',
  product_data: { ... },
  unit_amount: 999,
  recurring: {
    interval: 'month', // or 'year'
  },
},
```

---

## Support

- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
