# Project Doctrine — AQW-style browser MMO

Side-view 2D · click-to-move · shared 8-player rooms · real-time skill combat ·
offline doctrine · async PvP. Next.js 16 + Phaser-style canvas + Supabase
Broadcast/Presence only + Vercel.

## Rules enforced
- No `postgres_changes`. No position streaming (one `move_intent` per click).
- Server-authoritative: damage/loot/XP/offline sim in route handlers + `lib/game/`.
- Room capacity via atomic Postgres UPDATE, never Presence.
- Every Realtime send passes `budgetGuard()` — only `lib/realtime/budget.ts` calls `channel.send`.
- Heartbeats HTTP 30s; Realtime drop → HTTP poll 10s fallback.
- Client never writes game state; all mutations via service-role routes.

## Dev
```
npm install
npm run dev
npx supabase link --project-ref nnthnwgymarboijextko
npx supabase db push
npm run seed
npm run build
```
