# 汉语学习 — Chinese Language Learning App

A modern Chinese vocabulary learning application featuring HSK 1 & 2 words with example sentences, flashcards, practice sessions, and quiz modes.

## Features

- 📚 **Browse Mode** — Search and filter HSK vocabulary with example sentences
- 🔥 **Practice Mode** — Balanced learning sessions with spaced repetition
- 🃏 **Flashcard Mode** — Quick vocabulary drilling with tap-to-reveal
- ✏️ **Quiz Mode** — Multiple choice tests to check your knowledge
- 🔤 **Pinyin Hover/Tap** — Hover (desktop) or tap (mobile) any Chinese character to see its pinyin
- 🔊 **Text-to-Speech** — Hear native pronunciation using browser speech synthesis
- 📱 **Mobile Responsive** — Optimized for both desktop and mobile browsers

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe (optional premium features)
- **Auth**: Supabase Auth

---

## Running Locally (Offline Mode)

The app works completely offline with a built-in fallback vocabulary (~160 HSK words with examples).

```bash
npm install
npm run dev
```

Open http://localhost:5173 — the app will load with fallback data.

---

## Enabling Supabase (Full Vocabulary Database)

To enable the full vocabulary database with 450+ HSK words and example sentences:

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

### 2. Set Up Database Tables

Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Create HSK words table
CREATE TABLE hsk_words (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hanzi       TEXT NOT NULL UNIQUE,
  pinyin      TEXT NOT NULL,
  english     TEXT NOT NULL,
  hsk_level   INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Create example sentences table
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

-- Enable Row Level Security
ALTER TABLE public.hsk_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.example_sentences ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the anon key)
CREATE POLICY "Public read hsk_words" ON public.hsk_words FOR SELECT USING (true);
CREATE POLICY "Public read example_sentences" ON public.example_sentences FOR SELECT USING (true);

-- Create indexes for faster queries
CREATE INDEX idx_hsk_words_level ON hsk_words(hsk_level);
CREATE INDEX idx_example_sentences_word ON example_sentences(word_id);
```

### 3. Import Vocabulary Data

Import your HSK word list and example sentences into the tables. Format:

**hsk_words**:
```json
{ "hanzi": "爱", "pinyin": "ài", "english": "love, like", "hsk_level": 1 }
```

**example_sentences**:
```json
{ "word_id": 1, "hanzi": "我爱你。", "pinyin": "wǒ ài nǐ 。", "english": "I love you." }
```

### 4. Update Frontend to Use Supabase

Edit `src/App.tsx` and restore the Supabase imports:

```tsx
// At the top of the file, add:
import { fetchVocabularyFromSupabase } from "./data/supabaseVocab";

// In AppContent, add useEffect to load from Supabase:
useEffect(() => {
  fetchVocabularyFromSupabase().then((result) => {
    if (result.words.length > 0) {
      setVocabulary(result.words);
    }
  });
}, []);
```

### 5. Set Environment Variables

Create a `.env` file locally:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Vercel deployment, add these in the Vercel Dashboard → Settings → Environment Variables.

---

## Enabling Auth & Premium Features

The app includes optional authentication and Stripe payment integration.

### 1. Supabase Auth Setup

Run the SQL from `SUPABASE_SETUP.sql` in your Supabase SQL Editor to create:
- `profiles` table (stores user premium status)
- `subscriptions` table (stores Stripe subscription data)
- Auto-create profile trigger on user signup
- RLS policies for secure access

### 2. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create a Product and Price in the Stripe Dashboard
3. Set up a webhook endpoint pointing to `/api/webhook`
4. Configure webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### 3. Environment Variables (Vercel)

Add these to your Vercel project:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App
FRONTEND_URL=https://your-app.vercel.app
```

### 4. Restore Auth Components

To enable the Sign In button and profile page, update `src/App.tsx`:

```tsx
// Import auth components
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { AuthHeader } from "./components/AuthHeader";
import { ProfilePage } from "./components/ProfilePage";

// Wrap App in AuthProvider
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

---

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables (see above)
4. Deploy!

The `vercel.json` file configures:
- Build command: `npm run build`
- Output directory: `dist`
- API rewrites: `/api/*` → Vercel serverless functions

---

## Project Structure

```
├── src/
│   ├── App.tsx                 # Main app component
│   ├── components/             # React components
│   │   ├── FlashcardMode.tsx
│   │   ├── PracticeMode.tsx
│   │   ├── QuizMode.tsx
│   │   ├── VocabCard.tsx
│   │   ├── HoverCharacter.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── data/
│   │   ├── vocabulary.ts       # VocabWord type
│   │   ├── fallbackData.ts     # Offline vocabulary
│   │   └── supabaseVocab.ts    # Supabase data fetcher
│   └── hooks/
│       ├── useLearnedState.ts  # Local storage for progress
│       └── useIsMobile.ts      # Mobile detection
├── api/                        # Vercel serverless functions
│   ├── auth/
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── create-checkout-session.ts
│   ├── subscription.ts
│   ├── webhook.ts
│   └── health.ts
├── SUPABASE_SETUP.sql          # Database schema
└── vercel.json                 # Vercel config
```

---

## License

MIT
