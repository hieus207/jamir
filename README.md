# JAMIR — video commerce prototype

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · Base UI · shadcn-style primitives · Motion · Zustand · TanStack Query · React Hook Form + Zod · Embla.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
scripts/deploy.sh  # build and publish to the VPS (add --media to upload public/media)
```

## Structure

```
src/
  data/                 mock JSON "database" (products, reviews, KOL, FAQ, users, orders…)
  services/             data layer — the only code that knows where data comes from
    client.ts           get()/post(): REST when VITE_API_BASE_URL is set, else JSON mock
    db.ts               lazy loader for the JSON (never downloaded in REST mode)
    *Service.ts         getProducts, getProductBySlug, getProductReviews, getKolReviews, …
  hooks/queries.ts      TanStack Query hooks + query keys (UI talks to these only)
  stores/               Zustand: cart, wishlist, checkout, selection, swipe, ui
  components/ui/        primitives (Button, Dialog, Drawer, Sheet, Tabs, Accordion, Carousel, Toast…)
  components/jamir/     product/, review/, checkout/, navigation/, recommendation/, layout/
  lib/icons.tsx         icon-name → Lucide component mapper (JSON stores names only)
  pages/                route components (code-split)
```

## Switching to a real backend

Set `VITE_API_BASE_URL` (e.g. `https://api.jamir.vn/v1`) and implement the endpoints the
services already call — `GET /products/:slug`, `GET /products/:id/reviews?sort=`, `POST /orders`, …
(see each `*Service.ts`). Response shapes are the types in `src/types/domain.ts`. No component changes needed.

`VITE_MOCK_LATENCY` (ms, default 350) controls the simulated latency of the JSON mock.

## Notes

- Product swipe: mobile horizontal swipe, desktop side arrows or Shift + ← / →.
- Media under `public/media` (not committed) are CC-licensed stock photos with generated slideshow videos — see `public/media/manifest.json` for sources and licenses.
