# FranchiseGuard AI

Franchise standards audit and business analytics platform with three portals.

## Run

```bash
npm install
cp .env.example .env     # optional: add GEMINI_API_KEY for live AI analysis
npm run dev              # http://localhost:3000
```

Without a Gemini key the AI endpoints use built-in fallbacks, so every screen still works.

## Logins (also printed on the login page)

| Portal  | ID                         | Password |
|---------|----------------------------|----------|
| Owner   | `Yash`                     | `1845`   |
| Store   | `ST` + store number (1-500), e.g. `ST247` | `1845` |
| Officer | `Officer`                  | `1845`   |

This is an open demo gate checked in the browser, not real security. Replace `src/lib/auth.ts` with a server-side login before production use.

## What each portal shows

- **Owner**: analytics only (KPIs, trends, regional charts, risk, customer and operations graphs). Region and 4/8/12-week filters.
- **Store**: only the signed-in store: standards score, evidence and video upload with AI audit, corrective actions, customer reviews, brand standards.
- **Officer**: command center, store fleet search, action center (approve/dismiss/investigate, cure notices), cross-location patterns.

All portals share one in-memory dataset, so an upload or a decision in one portal shows up in the others during the session.

## Project layout

- `src/portals/` the three portals
- `src/components/` shared UI, charts (`charts.tsx`), login, plus the unchanged media upload and store inspector modals
- `src/lib/auth.ts` credentials and session
- `src/data/` mock fleet data, enrichment and analytics helpers
- `server.ts` Express + Gemini endpoints (unchanged)

## Video evidence and officer rating

1. A store uploads a video (Evidence & videos, then Upload photo or video).
2. The browser picks 10 random moments (one from each tenth of the video) and saves them as frames. Nothing is sent to a server for this.
3. The 10 frames go straight to the officer's **Evidence review** page. Customers and stores give no star rating.
4. The officer looks at the frames, gives 1 to 5 stars and an optional note. The rating changes the store's risk score (1: +20, 2: +10, 3: 0, 4: -5, 5: -10) and the store sees the result.

Notes: upload a video file for best results. Some web video links block frame capture, and the app will say so. Frames are kept in memory for the session.
