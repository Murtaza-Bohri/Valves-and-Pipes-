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

## Lottie

Place a Lottie JSON at `public/lottie/loader.json`, then import and pass it to `LoadingScreen` via `animationData`.

## UI libraries

Aceternity UI / Magic UI components can be added with their CLI once shadcn-style primitives are set up. `cn()` in `src/lib/utils.ts` is already in place.
