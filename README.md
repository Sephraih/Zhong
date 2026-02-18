# 汉语学习 — Chinese Language Learning App

A modern HSK 1 & 2 vocabulary learning app built with React, Vite, and Tailwind CSS.

## Features

- 📚 **Browse** — Search and filter vocabulary by HSK level, category, and learning status
- 🔥 **Practice** — Spaced repetition sessions with progress tracking
- 🃏 **Flashcards** — Quick drilling with Chinese ↔ English toggle
- ✏️ **Quiz** — Multiple choice questions to test your knowledge
- 📱 **Mobile-friendly** — Tap-to-reveal pinyin on touch devices
- 🔊 **Text-to-speech** — Hear native pronunciation (works best in Edge/Chrome)

## Quick Start (Offline Mode)

The app works out of the box with built-in fallback vocabulary (~160 words):

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Enabling Supabase (Full 450+ Words)

To load the complete HSK vocabulary from your Supabase database:

### 1. Set Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- HSK Words table
CREATE TABLE IF NOT EXISTS hsk_words (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hanzi       TEXT NOT NULL UNIQUE,
  pinyin      TEXT NOT NULL,
  english     TEXT NOT NULL,
  hsk_level   INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Example sentences table
CREATE TABLE IF NOT EXISTS example_sentences (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word_id     BIGINT NOT NULL REFERENCES hsk_words(id) ON DELETE CASCADE,
  hanzi       TEXT NOT NULL,
  pinyin      TEXT,
  english     TEXT NOT NULL,
  source      TEXT DEFAULT 'tatoeba',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(word_id, hanzi)
);

-- Enable Row Level Security
ALTER TABLE hsk_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE example_sentences ENABLE ROW LEVEL SECURITY;

-- Allow public read access (required for the app to fetch data)
CREATE POLICY "Public read hsk_words" ON hsk_words FOR SELECT USING (true);
CREATE POLICY "Public read example_sentences" ON example_sentences FOR SELECT USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_hsk_words_level ON hsk_words(hsk_level);
CREATE INDEX IF NOT EXISTS idx_example_sentences_word ON example_sentences(word_id);

-- Materialized view for FAST loading (pre-joins words + examples)
CREATE MATERIALIZED VIEW hsk_words_with_examples AS
SELECT
  w.id          AS word_id,
  w.hanzi,
  w.pinyin,
  w.english,
  w.hsk_level,
  COALESCE(
    json_agg(
      json_build_object(
        'id', s.id,
        'hanzi', s.hanzi,
        'pinyin', s.pinyin,
        'english', s.english
      )
      ORDER BY s.id
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) AS examples
FROM hsk_words w
LEFT JOIN example_sentences s ON s.word_id = w.id
GROUP BY w.id, w.hanzi, w.pinyin, w.english, w.hsk_level;

-- Indexes on the materialized view
CREATE UNIQUE INDEX idx_mv_word_id ON hsk_words_with_examples(word_id);
CREATE INDEX idx_mv_hsk_level ON hsk_words_with_examples(hsk_level);

-- Grant read access to the view
ALTER MATERIALIZED VIEW hsk_words_with_examples OWNER TO postgres;
GRANT SELECT ON hsk_words_with_examples TO anon, authenticated;

-- IMPORTANT: Refresh the view after importing data!
-- Run this command whenever you add/update words or examples:
-- REFRESH MATERIALIZED VIEW hsk_words_with_examples;
```

### 3. Import Vocabulary Data

Import your HSK vocabulary data into the `hsk_words` table and example sentences into `example_sentences`.

The app expects this JSON format for words:
```json
{
  "hanzi": "你好",
  "pinyin": "nǐ hǎo", 
  "english": "hello, hi",
  "hsk_level": 1
}
```

And this format for example sentences:
```json
{
  "word_id": 1,
  "hanzi": "你好，很高兴认识你。",
  "pinyin": "nǐ hǎo ， hěn gāo xìng rèn shi nǐ 。",
  "english": "Hello, nice to meet you."
}
```

### 4. Restart the Dev Server

```bash
npm run dev
```

The app will automatically fetch from Supabase if the environment variables are set. If Supabase is unavailable, it falls back to the built-in vocabulary.

### 5. Refresh the Materialized View

After importing or updating data, refresh the view in Supabase SQL Editor:

```sql
REFRESH MATERIALIZED VIEW hsk_words_with_examples;
```

### Caching

The app caches vocabulary data in localStorage for 7 days to speed up repeat visits. To force a fresh fetch:
- Open browser DevTools → Application → Local Storage
- Delete the `hanyu_vocab_cache_v2` key
- Refresh the page

Or programmatically in the browser console:
```js
localStorage.removeItem('hanyu_vocab_cache_v2');
location.reload();
```

## Deployment to Vercel

### Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Deploy

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Enabling Auth & Premium Features

The app includes optional authentication and Stripe payment integration. To enable:

### 1. Additional Environment Variables

```env
# Supabase (service role for server-side operations)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Frontend URL (for Stripe redirects)
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Set Up Auth Tables in Supabase

Run the SQL from `SUPABASE_SETUP.sql` to create the `profiles` and `subscriptions` tables.

### 3. Configure Stripe Webhook

In your Stripe Dashboard, add a webhook endpoint:
- URL: `https://your-app.vercel.app/api/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### 4. Auth is Enabled by Default

The auth components are already imported and working in `src/App.tsx`:
- `AuthProvider` wraps the entire app
- `AuthHeader` shows Sign In button (or user menu when logged in)
- `AuthModal` handles login/signup
- `ProfilePage` shows subscription status and upgrade button

**Note:** If Supabase is not configured, auth operations will show a friendly "not available in preview mode" message instead of crashing.

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
├── index.css               # Tailwind CSS
├── supabaseClient.ts       # Supabase client (safe if env vars missing)
├── components/
│   ├── LandingPage.tsx     # Home page with mode selection
│   ├── VocabCard.tsx       # Vocabulary card for Browse mode
│   ├── FlashcardMode.tsx   # Flashcard study mode
│   ├── PracticeMode.tsx    # Spaced repetition practice
│   ├── QuizMode.tsx        # Multiple choice quiz
│   ├── HoverCharacter.tsx  # Pinyin hover/tap component
│   ├── SpeakerButton.tsx   # Text-to-speech button
│   ├── AuthHeader.tsx      # User menu (auth enabled)
│   ├── AuthModal.tsx       # Login/signup modal (auth enabled)
│   └── ProfilePage.tsx     # User profile (auth enabled)
├── contexts/
│   └── AuthContext.tsx     # Auth state management
├── data/
│   ├── vocabulary.ts       # VocabWord type definition
│   ├── fallbackData.ts     # Built-in vocabulary (offline mode)
│   └── supabaseVocab.ts    # Supabase data fetching
├── hooks/
│   ├── useLearnedState.ts  # Learning progress (localStorage)
│   └── useIsMobile.ts      # Mobile device detection
└── utils/
    └── cn.ts               # Tailwind class merging utility

api/                        # Vercel serverless functions
├── auth/
│   ├── login.ts
│   ├── logout.ts
│   ├── me.ts
│   └── signup.ts
├── create-checkout-session.ts
├── subscription.ts
├── webhook.ts
└── health.ts
```

## License

MIT
