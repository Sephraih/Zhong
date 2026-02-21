# 汉语学习 — Chinese Language Learning App

A modern Chinese vocabulary learning app featuring HSK 1-4 words with examples, interactive flashcards, practice sessions, and quizzes.

## Features

- **Browse Mode**: Search and filter vocabulary by HSK level, category, and learned status
- **Practice Mode**: Spaced repetition with progress tracking (8 new + 2 review words per session)
- **Flashcard Mode**: Quick drilling with shuffle, prev/next navigation, and learned/learning toggle
- **Quiz Mode**: Multiple choice questions to test recall
- **Pinyin Hover/Tap**: Hover (desktop) or tap (mobile) any Chinese character to see its pinyin
- **Text-to-Speech**: Click the speaker icon to hear pronunciation
- **Mobile Optimized**: Responsive design with touch-friendly interactions
- **Progress Persistence**: Learning progress saved to localStorage

## User Tiers

| Tier | Access |
|------|--------|
| **Anonymous** (not logged in) | Top 200 HSK 1 words only |
| **Free** (logged in) | Full HSK 1 access |
| **Per-level Purchase** | Buy individual HSK levels (2, 3, 4) |
| **Premium** | All current and future levels (1-9) |

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The app works offline with fallback vocabulary data (~160 words). For full functionality, configure Supabase and Stripe.

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings → API

### 2. Run Database Migrations

Run these SQL scripts in **Supabase Dashboard → SQL Editor**:

#### Basic Tables (`SUPABASE_SETUP.sql`)
```sql
-- Creates: profiles, subscriptions tables
-- Run the contents of SUPABASE_SETUP.sql
```

#### Tiered Access Tables (`supabase_tiered_access.sql`)
```sql
-- Creates: purchased_levels table, account_tier column, get_user_access() function
-- Run the contents of supabase_tiered_access.sql
```

#### HSK Vocabulary Tables
```sql
CREATE TABLE hsk_words (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hanzi       TEXT NOT NULL UNIQUE,
  pinyin      TEXT NOT NULL,
  english     TEXT NOT NULL,
  hsk_level   INTEGER NOT NULL,
  word_type   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE example_sentences (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word_id     BIGINT NOT NULL REFERENCES hsk_words(id) ON DELETE CASCADE,
  hanzi       TEXT NOT NULL,
  pinyin      TEXT,
  english     TEXT NOT NULL,
  source      TEXT DEFAULT 'tatoeba',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(word_id, hanzi)
);

-- Enable RLS
ALTER TABLE hsk_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE example_sentences ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public read hsk_words" ON hsk_words FOR SELECT USING (true);
CREATE POLICY "public read examples" ON example_sentences FOR SELECT USING (true);
```

#### Create Materialized View (for fast queries)
```sql
CREATE MATERIALIZED VIEW hsk_words_with_examples AS
SELECT
  w.id AS word_id,
  w.hanzi,
  w.pinyin,
  w.english,
  w.hsk_level,
  w.word_type,
  COALESCE(
    json_agg(
      json_build_object('id', s.id, 'hanzi', s.hanzi, 'pinyin', s.pinyin, 'english', s.english)
      ORDER BY s.id
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) AS examples
FROM hsk_words w
LEFT JOIN example_sentences s ON s.word_id = w.id
GROUP BY w.id, w.hanzi, w.pinyin, w.english, w.hsk_level, w.word_type;

CREATE UNIQUE INDEX idx_mv_word_id ON hsk_words_with_examples(word_id);
CREATE INDEX idx_mv_hsk_level ON hsk_words_with_examples(hsk_level);

GRANT SELECT ON hsk_words_with_examples TO anon, authenticated;
```

### 3. Import Vocabulary Data

Import your HSK vocabulary data into `hsk_words` and `example_sentences` tables, then refresh the view:
```sql
REFRESH MATERIALIZED VIEW hsk_words_with_examples;
```

---

## Stripe Setup (Payments)

### 1. Create Stripe Products

In **Stripe Dashboard → Products**, create these one-time payment products:

| Product | Suggested Price | Environment Variable |
|---------|----------------|---------------------|
| HSK Level 2 | $4.99 | `STRIPE_PRICE_HSK2` |
| HSK Level 3 | $6.99 | `STRIPE_PRICE_HSK3` |
| HSK Level 4 | $9.99 | `STRIPE_PRICE_HSK4` |
| Premium (All Levels) | $19.99 | `STRIPE_PRICE_PREMIUM` |

**Important**: Create as **one-time payments**, not subscriptions!

### 2. Configure Webhook

In **Stripe Dashboard → Developers → Webhooks**, add endpoint:

- **URL**: `https://your-app.vercel.app/api/webhook`
- **Events to listen**: 
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

Copy the **Signing secret** for `STRIPE_WEBHOOK_SECRET`.

---

## Environment Variables

### Local Development (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Vercel Deployment

Set these in **Vercel Dashboard → Settings → Environment Variables**:

```env
# Frontend (VITE_ prefix)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API routes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx for testing)
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_HSK2=price_xxx
STRIPE_PRICE_HSK3=price_xxx
STRIPE_PRICE_HSK4=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx

# URLs
FRONTEND_URL=https://your-app.vercel.app
```

---

## Project Structure

```
├── src/
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   ├── index.css            # Tailwind imports
│   ├── supabaseClient.ts    # Supabase client (safe with missing env vars)
│   │
│   ├── components/
│   │   ├── LandingPage.tsx     # Home page with mode previews
│   │   ├── VocabCard.tsx       # Individual vocabulary card
│   │   ├── FlashcardMode.tsx   # Flashcard study mode
│   │   ├── PracticeMode.tsx    # Spaced repetition practice
│   │   ├── QuizMode.tsx        # Multiple choice quiz
│   │   ├── ProfilePage.tsx     # User profile & purchases
│   │   ├── AuthModal.tsx       # Login/signup modal
│   │   ├── AuthHeader.tsx      # Header auth controls
│   │   ├── HoverCharacter.tsx  # Pinyin hover/tap component
│   │   ├── SpeakerButton.tsx   # Text-to-speech button
│   │   └── ...
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   │
│   ├── data/
│   │   ├── vocabulary.ts       # VocabWord type definition
│   │   ├── supabaseVocab.ts    # Fetch vocabulary from Supabase
│   │   └── fallbackData.ts     # Offline fallback vocabulary
│   │
│   ├── hooks/
│   │   ├── useLearnedState.ts  # Track learned words in localStorage
│   │   └── useIsMobile.ts      # Mobile device detection
│   │
│   └── utils/
│       ├── cn.ts               # Tailwind class merging
│       ├── hskColors.ts        # HSK badge color helpers
│       └── hskAccess.ts        # Access level utilities
│
├── api/                        # Vercel serverless functions
│   ├── auth/
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── create-checkout-session.ts
│   ├── webhook.ts
│   ├── subscription.ts
│   └── health.ts
│
├── public/
│   ├── landscape.jpeg         # Desktop background
│   └── portrait.png           # Mobile background
│
└── Configuration files
    ├── vercel.json            # Vercel deployment config
    ├── tsconfig.json          # TypeScript config
    └── vite.config.ts         # Vite build config
```

---

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set all environment variables (see above)
4. Deploy!

Vercel will automatically:
- Build the frontend with Vite
- Deploy API routes as serverless functions
- Apply rewrites from `vercel.json`

---

## Development Notes

### Offline Mode
The app works without any backend connection:
- Falls back to ~160 HSK 1-2 words from `fallbackData.ts`
- Authentication features are gracefully disabled
- All study modes remain functional

### Mobile Support
- Touch-friendly tap-to-reveal pinyin
- Auto-hiding header on scroll
- Responsive card sizing with stable viewport height
- Swipe gestures in Practice mode (optional)

### Performance
- Vocabulary data is cached in localStorage (14-day TTL)
- Browse mode uses pagination to avoid rendering 1000+ cards
- Supabase queries use a materialized view for fast joins
- Background data refresh uses React transitions

---

## License

MIT
