# MONWOLF · TODO

Living roadmap. Newest additions at the top of each section.

---

## 🟧 In flight · awaiting King's input

### Onramper partner key + payout wallet — `/buy.html` is currently in COMING SOON mode
- **Current state**: The "BUY MON WITH CARD" card on `/buy.html` is wired but rendered as a coming-soon teaser (disabled button + COMING SOON badge + pulsing gold). Marketing value of the card is preserved; the actual Onramper widget is not opened on click.
- **To go live**:
  1. Sign up at https://dashboard.onramper.com/users/sign_up
  2. Verify partner status (Onramper KYBs orgs — usually 1–2 business days)
  3. Configure fee splits in their dashboard
  4. Set the Monad payout wallet that receives partner-side commission
  5. Send Claude the `apiKey` string + payout wallet address
- **Wire-in to flip live**: 3 edits in `/buy.html`:
  - Drop the `soon` class from `.onramp-card`
  - Drop the `disabled` attribute from `#onrampBtn`
  - Remove the `<span class="soon-badge">` from the card header
  - Set `ONRAMPER_API_KEY` constant
  - Restore the original button copy (`BUY MON WITH CARD →`) and helper line

### Supabase migration for `/memes`
- ✅ DONE — verified via REST probe: table `monwolf_memes` returns 200 + empty array, storage bucket `monwolf-memes` exists. Migration ran successfully. Wall is live at `/memes`, just waiting for the first post.

### WalletConnect Project ID
- Current value in `/index.html` and `/swap.html` is a placeholder.
- Get a real one at https://cloud.walletconnect.com — replace `WC_PROJECT_ID` constant.

---

## 🟪 Queued · build-ready, no input needed

### Onramper Headless SDK upgrade (no popup, native UI)
- **What**: Current integration opens a hosted-widget popup at `buy.onramper.com`. Onramper's [Headless SDK](https://onramper.com/products/headless-ramps) lets us render the entire purchase flow inside `/buy.html` — native Apple Pay, no iframe, no redirect.
- **Why**: Pop-ups get blocked on mobile Safari; iframe redirects break native UX. Headless gives full UI control + 1-click Apple Pay buys.
- **How**:
  ```js
  import { OnramperSDK } from '@onramper/sdk'
  const checkout = await OnramperSDK.init({
    apiKey: ONRAMPER_API_KEY,
    walletAddress: STATE.account,
    crypto: 'mon_monad',
    fiat: 'USD',
    amount: 50,
  })
  // checkout.trigger() launches native flow
  ```
- **Blockers**: Requires `apiKey` (see "In flight" above) + a build step to bundle the SDK (or find a UMD/CDN version of `@onramper/sdk`).
- **Effort**: ~1 day per Onramper's own docs.

### Onramper Swaps (cross-chain → $MONWOLF directly)
- **What**: Onramper has a [Swaps product](https://onramper.com/products/swaps) — cross-chain swap from one asset on one chain to another asset on another chain.
- **Use case**: A user with USDC on Ethereum or SOL on Solana could swap directly into $MONWOLF on Monad — no bridge, no manual swap. One transaction, end-to-end.
- **Wire**: Same SDK, swap endpoint instead of buy. Same `apiKey`.
- **Why it matters**: Removes the biggest friction for users with crypto on other chains who want to enter Monad. Today they have to bridge → swap to MON → swap to MONWOLF (3 steps + gas on each). Onramper Swaps collapses it to one.

### `arcade.html` + `comic.html` redesign
- Both pages still use the older design system (pre-Bungee/Inter rebuild).
- Migrate to the same palette + typography as `/`, `/buy`, `/swap`, `/hub`, `/memes`.
- Keep all interactive game/comic logic intact.

### MonWolf game in `/arcade`
- Pending sprite assets (Pack Patrol mockup design exists).

---

## 🟩 Future · pack culture features

### The Bouncer (vouch-based onboarding)
- Existing holders burn $MONWOLF to vouch new members into the pack.
- 5-tier vouch system: Sheep → Lone Alpha.
- Howl Wall: burn-to-post pack messages.

### Moon Hunt events
- Full-moon coordinated pack raids.
- On-chain reward distribution to participants.

### Howl Wall (burn-to-post alpha)
- Burn $MONWOLF to publish a "howl" to the pack feed.
- Pack reacts; top howls get amplified.

---

## ✅ Recently shipped

- Onramper hosted-widget integration on `/buy.html` (replaced Transak; works for Monad)
- Splash gate switched from sessionStorage (one-shot) to localStorage + 2hr TTL + `?splash=1` force-show
- "NEW TO CRYPTO?" hero CTA → `/buy.html?path=new` with onramp card highlight
- Splash retime: `RISES` fades out before the wolf claims the screen
- Wolf overlays on the chart frame ("PACK IS WATCHING" + "AWOOO ↗")
- Pack-rises splash intro (grok video, sessionStorage-once)
- GeckoTerminal chart embed (Cloudflare blocked DexScreener iframe)
- `/memes` wall + Supabase storage architecture
- Heavy DexScreener data integration on homepage (multi-timeframe pulse)
- nad.fun prominently featured as primary trade pill
- Forbes-look → memecoin aesthetic restoration (Bungee + cyber gradient)
- `/swap` "NO WALLET YET?" banner → `/buy`
- /memes link added to nav across all surfaces
- `/buy` embedded Pack Wallet + universal token swap
- `/hub` dashboard
