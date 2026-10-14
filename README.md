# Himmat Oil Fields

Next.js marketing & product site for **Himmat Oil Fields**, wired for premium motion and Supabase.

## Stack

| Purpose | Tool |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS |
| Hero animation | GSAP |
| Scroll animations | GSAP ScrollTrigger |
| Buttons & cards | Motion (Framer Motion) |
| Loading animation | LottieFiles (`lottie-react`) |
| 3D watch viewer | Three.js + React Three Fiber / Drei |
| UI helpers | `clsx`, `tailwind-merge`, `cva` (Aceternity / Magic UI ready) |
| Database | Supabase |

## Getting started

```bash
cd himmat-oil-fields
npm install
cp .env.local.example .env.local
# Add your Supabase URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                 # App Router pages
  components/          # Hero, LoadingScreen, FeatureSection, WatchViewer
  lib/
    gsap.ts            # GSAP + ScrollTrigger registration
    supabase/          # Browser + server clients
    utils.ts           # cn() helper for UI libraries
public/
  lottie/              # Drop Lottie JSON files here
```

## Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy URL and anon key into `.env.local`
3. Use `supabase` from `@/lib/supabase/client` in client components, or `createSupabaseServerClient()` on the server

## Ziina payments

Checkout creates an order, then opens Ziina’s hosted payment page when configured.

Add to `.env.local` (server-only except site URL):

| Variable | Purpose |
| --- | --- |
| `ZIINA_ACCESS_TOKEN` | Bearer token from [Ziina developer docs](https://docs.ziina.com/developers/custom-integration) |
| `ZIINA_WEBHOOK_SECRET` | Optional HMAC secret when registering your webhook |
| `ZIINA_TEST_MODE` | Set to `true` for test payment intents (no real charge) |
| `NEXT_PUBLIC_SITE_URL` | **Production:** your live domain (e.g. `https://www.himmat.ae`) — required on Vercel; do **not** use `http://localhost:3000` in Vercel env vars or Ziina will send customers to the wrong site after payment |

1. Apply migration `supabase/migrations/002_ziina_payments.sql` to your database.
2. Register webhook URL: `https://yourdomain.com/api/webhooks/ziina` (see [Ziina webhooks](https://docs.ziina.com/api-reference/webhook/index.md)).
3. Without `ZIINA_ACCESS_TOKEN`, checkout skips Ziina and behaves as before (order confirmation only).

## Lottie

Place a Lottie JSON at `public/lottie/loader.json`, then import and pass it to `LoadingScreen` via `animationData`.

## UI libraries

Aceternity UI / Magic UI components can be added with their CLI once shadcn-style primitives are set up. `cn()` in `src/lib/utils.ts` is already in place.
