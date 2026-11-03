# Auction setup

The /auction page talks to serverless functions in `api/` (Vercel), which store bids in
Redis (Upstash) and save bidders' cards with Stripe. Money is never moved by the site.

## Environment variables (Vercel > Project > Settings > Environment Variables)

| Name | What |
|---|---|
| STRIPE_SECRET_KEY | Stripe secret key (start with `sk_test_` to rehearse, then `sk_live_`) |
| STRIPE_PUBLISHABLE_KEY | Matching publishable key (`pk_test_` / `pk_live_`) |
| SESSION_SECRET | Any long random string. Signs bidder sessions |
| ADMIN_TOKEN | Any long random string. Opens `/api/admin?key=...` |
| AUCTION_RESERVE | Hidden reserve in whole USD. Set to `700`. Bidding stays CLOSED until this is set. `0` = no reserve |
| AUCTION_ENDS_AT | Optional. Default `2026-12-06T21:00:00-05:00` |
| AUCTION_STARTS_AT | Optional. Bidding opens at this time. Default: immediately |
| KV_REST_API_URL / KV_REST_API_TOKEN | Added automatically by the Upstash Redis integration from the Vercel Marketplace |

Test keys and live keys must not be mixed (use the matching pair). Use a different
Redis database for rehearsal, or clear it, before going live.

## After the close
Open `/api/admin?key=ADMIN_TOKEN`. It lists bids, whether the reserve was met, and the
winner with a link to their Stripe customer. Charge the saved card from the Stripe
dashboard (Customers > customer > Payment methods), or take payment in ZEC by arrangement.

## Tests
`npm run test:auction` runs the bid rules (increments, reserve, anti-sniping, races, auth).

## Going live
1. Add the settings above in Vercel (with test keys first) and redeploy.
2. Place a test bid, check `/api/admin?key=...`, then swap in live keys and clear the test data.
3. The main page and `/auction/` read the live status automatically. "Bidding opens soon" turns into "Live auction" as soon as the settings are in.
