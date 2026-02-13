# 🚀 Quick Start: Deploy to Vercel

## Prerequisites
- ✅ GitHub account
- ✅ Vercel account (free)
- ✅ Supabase project created
- ✅ Stripe account with a product/price created

---

## 5-Minute Deployment

### 1️⃣ Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2️⃣ Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Click **"Deploy"** (don't add env vars yet)

### 3️⃣ Add Environment Variables
After first deployment, go to **Settings → Environment Variables** and add:

```bash
# Copy from your Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Copy from your Stripe Dashboard → Developers → API keys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx

# Will configure after webhook setup
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Update with your actual Vercel URL after first deploy
FRONTEND_URL=https://your-app.vercel.app
VITE_API_BASE=https://your-app.vercel.app
```

Click **"Save"** → **"Redeploy"**

### 4️⃣ Configure Stripe Webhook
1. Stripe Dashboard → [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. URL: `https://your-app.vercel.app/api/webhook`
4. Events: Select all 5 events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. **Copy the signing secret** → Add to Vercel as `STRIPE_WEBHOOK_SECRET`
6. **Redeploy** in Vercel

### 5️⃣ Configure Supabase
1. Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URL: `https://your-app.vercel.app`
3. Save

---

## ✅ Test Your App

Visit: `https://your-app.vercel.app`

Test flow:
1. Sign up with email/password
2. Sign in
3. Click avatar → "Upgrade to Premium"
4. Use test card: `4242 4242 4242 4242`
5. Verify premium status updates

---

## 📝 Local Development

Keep using your Express backend for local dev:

**Terminal 1 - Local Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The local `.env` file will point to `http://localhost:4242`.

---

## 🔄 Making Updates

```bash
# Make your changes
git add .
git commit -m "Update feature"
git push

# Vercel auto-deploys on push!
```

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| 404 on `/api/*` | Check `vercel.json` exists and is valid |
| CORS errors | Update `FRONTEND_URL` to match your Vercel URL |
| Webhook fails | Use Stripe's production webhook endpoint (not localhost) |
| Auth errors | Double-check Supabase redirect URLs |

---

## 📊 Monitoring

- **Vercel Logs**: Deployments → Select deployment → Functions
- **Stripe Events**: Webhooks → Your endpoint → Events
- **Supabase Logs**: Database → Logs

---

## 🎉 Done!

Your app is now live with:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Serverless scaling
- ✅ Zero server management

Share it: `https://your-app.vercel.app`
