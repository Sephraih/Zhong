# Vercel Deployment Guide

## Overview
This guide will walk you through deploying your Chinese Learning App to Vercel with a serverless backend.

---

## 📁 Project Structure

```
project/
├── api/                    # Vercel Serverless Functions (backend)
│   ├── auth/
│   │   ├── signup.ts
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── create-checkout-session.ts
│   ├── webhook.ts
│   ├── subscription.ts
│   └── health.ts
├── src/                    # React frontend
├── backend/                # Original Express backend (keep for local dev)
├── vercel.json            # Vercel configuration
└── package.json
```

---

## 🚀 Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

---

## 🔐 Step 2: Prepare Environment Variables

You'll need to set these in the Vercel dashboard:

### Required Variables:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx  # Use sk_test_xxx for testing
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# Frontend
FRONTEND_URL=https://your-app.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=https://your-app.vercel.app
```

---

## 🌐 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure project:**
   - Framework Preset: **Vite**
   - Root Directory: `./` (keep default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables** (Settings → Environment Variables):
   - Add all variables listed in Step 2
   - Make sure to add both production AND preview environment variables
6. **Click "Deploy"**

### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

After deployment, you'll get a URL like: `https://your-app.vercel.app`

---

## 🔧 Step 4: Update Environment Variables

After first deployment, update these variables in Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Update `VITE_API_BASE` to your actual Vercel URL:
   ```
   VITE_API_BASE=https://your-app.vercel.app
   ```
4. **Redeploy** (Deployments → click ⋯ → Redeploy)

---

## 🎯 Step 5: Configure Stripe Webhook (Production)

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-app.vercel.app/api/webhook`
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. **Click "Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`)
7. **Update `STRIPE_WEBHOOK_SECRET`** in Vercel environment variables
8. **Redeploy**

---

## 🔄 Step 6: Configure Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project → **Authentication → URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/*
   ```
4. **Save**

---

## ✅ Step 7: Test Your Deployment

1. Visit `https://your-app.vercel.app`
2. Test authentication (sign up / sign in)
3. Test premium upgrade flow
4. Monitor Vercel logs: **Deployments → Click deployment → Functions**
5. Monitor Stripe webhook logs: **Stripe Dashboard → Webhooks → Your endpoint → Events**

---

## 🐛 Troubleshooting

### Issue: "CORS Error"
**Solution**: Make sure `FRONTEND_URL` is set to your Vercel URL in environment variables

### Issue: "Webhook signature verification failed"
**Solution**: 
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Make sure you created a webhook for the **production URL** (not localhost)

### Issue: "Unauthorized" errors
**Solution**: Check that `SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_ANON_KEY` are correct

### Issue: Function timeout
**Solution**: Vercel free tier has 10s function timeout. Upgrade if needed.

---

## 📊 Monitor Your App

- **Vercel Dashboard**: Real-time logs and analytics
- **Supabase Dashboard**: Database queries and auth logs
- **Stripe Dashboard**: Payment and webhook events

---

## 🔒 Security Checklist

- ✅ Never commit `.env` files to git
- ✅ Use environment variables in Vercel for all secrets
- ✅ Use Stripe test keys for testing, live keys for production
- ✅ Enable Supabase RLS (Row Level Security) policies
- ✅ Set correct CORS origins in Supabase settings

---

## 🎉 You're Live!

Your app is now deployed with:
- ✅ Serverless backend on Vercel
- ✅ React frontend on Vercel CDN
- ✅ Supabase authentication & database
- ✅ Stripe payment processing
- ✅ Automatic HTTPS and global CDN

Share your app: `https://your-app.vercel.app`
