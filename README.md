# 🚀 Agentic AI Ad Automator

> Voice → AI → Meta Live Ad in under 60 seconds.

A production-ready Next.js 14 web app that listens to your voice brief, uses GPT-4o to extract ad structure, generates an image with DALL-E 3, previews it in a glassmorphic UI, and deploys a live campaign via the Meta Graph API.

---

## ✨ Features

- 🎙️ **Voice Input** — Web Speech API (real-time) + OpenAI Whisper fallback
- 🧠 **AI Processing** — GPT-4o extracts caption, image prompt, audience, budget, location
- 🎨 **Image Generation** — DALL-E 3 HD creates the ad visual
- 🔍 **Approval UI** — Inline-editable glassmorphic preview card
- 🚀 **Meta Deployment** — Full Graph API flow: campaign → ad set → creative → ad
- 💎 **Premium UI** — Apple-style dark glassmorphism, Sora font, smooth animations

---

## 📁 Folder Structure

```
agentic-ai-ad-automator/
├── app/
│   ├── api/
│   │   ├── transcribe/route.js       # POST: audio → Whisper → text
│   │   ├── process-ad/route.js       # POST: text → GPT-4o → structured JSON
│   │   ├── generate-image/route.js   # POST: prompt → DALL-E 3 → image URL
│   │   └── deploy-ad/route.js        # POST: adData + imageUrl → Meta Graph API
│   ├── globals.css                   # Global styles, Tailwind base, animations
│   ├── layout.jsx                    # Root layout with toast provider
│   └── page.jsx                      # Main page / state machine orchestrator
├── components/
│   ├── VoiceInput.jsx                # Mic button, waveform, transcript textarea
│   ├── ProcessingOverlay.jsx         # Animated loading states
│   ├── AdPreviewCard.jsx             # Glassmorphic ad preview with inline editing
│   ├── StepIndicator.jsx             # Progress indicator (4 steps)
│   └── SuccessScreen.jsx             # Post-deployment success view
├── lib/
│   ├── openai.js                     # OpenAI singleton client
│   ├── meta.js                       # Meta Graph API utilities
│   └── utils.js                      # General helpers
├── .env.example                      # Copy to .env.local and fill in keys
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## ⚡ Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your real keys (see below).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
npx vercel
```

Add your env vars in the Vercel dashboard under **Settings → Environment Variables**.

---

## 🔑 API Keys You Need

### OpenAI
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key → copy it to `OPENAI_API_KEY`
3. Ensure your account has access to `gpt-4o` and `dall-e-3`
4. Recommended: set a monthly spend limit

### Meta Graph API
1. Go to [developers.facebook.com](https://developers.facebook.com/) → Create App → **Business** type
2. Add **Marketing API** product
3. Generate a **System User Token** in Meta Business Manager with permissions:
   - `ads_management`
   - `ads_read`
   - `pages_read_engagement`
   - `instagram_basic` (if using Instagram)
4. Copy values to:
   - `META_ACCESS_TOKEN` — System User token
   - `META_AD_ACCOUNT_ID` — From Business Manager → Ad Accounts (format: `act_XXXXX`)
   - `META_PAGE_ID` — From your Facebook Page → About → Page ID
   - `META_INSTAGRAM_ACTOR_ID` — Instagram account ID (optional, enables Instagram placements)

---

## 🔄 How It Works — Full Flow

```
User speaks brief
      │
      ▼
[Web Speech API] ──(fallback)──► [Whisper /api/transcribe]
      │
      ▼
[GPT-4o /api/process-ad]
  → caption, imagePrompt, location, budget, audience, targeting...
      │
      ▼
[DALL-E 3 /api/generate-image]
  → ad image URL
      │
      ▼
[AdPreviewCard — user reviews & edits]
      │
      ▼
[Meta Graph API /api/deploy-ad]
  1. Upload image → get hash
  2. Create Campaign (PAUSED)
  3. Create Ad Set (targeting + budget)
  4. Create Ad Creative (image + caption)
  5. Create Ad
      │
      ▼
[SuccessScreen — Campaign IDs + Ads Manager link]
```

> ⚠️ Campaigns are created in **PAUSED** state by default. Go to Meta Ads Manager to review and activate. This prevents accidental spend.

---

## 🛡️ Production Checklist

- [ ] Use a **System User Token** (not personal user token) — they don't expire
- [ ] Set up **Meta Pixel** and add pixel ID in `deploy-ad/route.js`
- [ ] Store generated images in **S3/Cloudflare R2** instead of using DALL-E's expiring URLs
- [ ] Add a **rate limiting** layer (e.g., Upstash Redis) on API routes
- [ ] Set up **error logging** (e.g., Sentry)
- [ ] Add **user authentication** (e.g., Clerk or NextAuth)
- [ ] Consider storing campaign history in **Postgres/Supabase**

---

## 🧩 Extending the App

**Multiple ad variations**: Change `n: 1` to `n: 3` in `generate-image/route.js` and let the user pick.

**Video ads**: Replace DALL-E with a video generation API (Runway, Pika) and use `video_data` in the creative instead of `link_data`.

**WhatsApp Click-to-Chat ads**: Change the CTA `value.link` to a `wa.me/` URL.

**Retargeting**: Add a Custom Audience field targeting website visitors (requires Pixel setup).

---

## 📄 License

MIT — build freely, ship boldly.
