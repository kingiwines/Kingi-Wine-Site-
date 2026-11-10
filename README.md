# Kingi Wines website

The Kingi Wines site (kingiwines.com), set up for **GitHub + Netlify + Stripe Checkout**.

- `public/` is the website itself (pages, images, licence PDFs).
- `netlify/functions/create-checkout-session.mjs` is the small server function that starts a Stripe payment. It runs on Netlify, so your Stripe secret key never reaches the browser.
- `netlify/shop/catalogue.mjs` holds **the prices customers are charged** and the shipping settings.

---

## ⚠️ Keep your Stripe secret key secret

- Your secret key starts with `sk_live_` (real money) or `sk_test_` (testing).
- **Never** paste it into any file in this folder, into GitHub, or into a chat.
- It only goes in **Netlify → Site configuration → Environment variables** (step 3 below).
- If it is ever exposed, roll it straight away in Stripe → Developers → API keys.

---

## 1. Before you start: two settings to fill in

**Shipping.** Set in `netlify/shop/catalogue.mjs`: free from six bottles. Under six, the customer picks their region on Stripe's payment page: Auckland incl. Waiheke $14, rest of North Island $18, South Island $23. Stripe can't check the region against the address automatically, so glance at each order's address before you send it.

**Prices.** These are already set ($62 / $55 / $39 / $32). If you ever change one, change it in **both**:
1. `netlify/shop/catalogue.mjs`: what Stripe charges.
2. `public/index.html`: what the site shows (search for `price: 62` etc. and the matching `priceLabel: "$62"`).

## 2. Put the code on GitHub

1. Sign in at github.com → **New repository** → name it `kingi-wines-site` → **Private** → Create.
2. On the empty repo page, click **uploading an existing file**.
3. Drag in **everything inside this folder** (including the hidden `.gitignore` file. On a Mac, press Cmd+Shift+. in Finder to show hidden files). Don't upload a `node_modules` folder or any `.env` file.
4. Click **Commit changes**.

(GitHub Desktop is easier for future updates: File → Add local repository → choose this folder → Publish.)

## 3. Connect Netlify

1. Sign in at netlify.com → **Add new site → Import an existing project → GitHub** → choose `kingi-wines-site`.
2. The build settings fill themselves in from `netlify.toml` (publish folder `public`). Click **Deploy**.
3. Go to **Site configuration → Environment variables → Add a variable**:
   - Key `STRIPE_SECRET_KEY`, value: your **test** key `sk_test_…` first. Tick "Contains secret values".
4. **Deploys → Trigger deploy → Deploy site** so the key takes effect.

## 4. Test a payment (no real money)

1. Open your Netlify address (e.g. `kingi-wines.netlify.app`), pass the age check, add 6 bottles, tick the 18+ box, and click **Continue to payment**.
2. On Stripe's page use card `4242 4242 4242 4242`, any future expiry, any CVC, any NZ address.
3. You should land on the "Your pre-order is in" page, and the payment shows in Stripe → Payments (test mode).

## 5. Go live

1. In Stripe, finish account activation (business details, bank account).
2. Stripe → **Settings → Customer emails** → turn on **Successful payments** so customers get receipts.
3. In Netlify, change `STRIPE_SECRET_KEY` to your **live** key `sk_live_…` and redeploy.
4. **Domain:** Netlify → Domain management → Add `kingiwines.com` and follow the DNS steps. Your licence names KingiWines.com as the premises.

## 6. Forms (Join list and Trade enquiries)

Both forms use **Netlify Forms**. After the first deploy, go to **Forms**, enable form detection if asked, and redeploy. Submissions appear under Forms → `join` and `trade`. Set up email alerts in Forms → Form notifications.

## 7. Promo codes

Create codes in Stripe → **Product catalogue → Coupons**: make a coupon, then add a customer-facing promotion code (e.g. `MATES10`). Customers can type it on your cart page or on Stripe's payment page. Keep discounts under 25% off your normal price, in line with your Social Responsibility Policy.

## Licence compliance built in

| Licence condition | Where it's handled |
|---|---|
| (d)(i) Age prompt on entering the site | Age check pop-up on first visit |
| (d)(ii) Age prompt immediately before the sale | 18+ tick box before "Continue to payment" (the server refuses checkout without it). Optional extra tick box on Stripe's page: see below |
| (e) Name, licence no. and expiry on receipts | Added to every Stripe invoice/receipt footer and custom fields |
| (f) Link to an image of the licence | "Liquor licence (PDF)" in the footer on every page |
| Delivery restrictions | Shown at checkout and on the Stripe payment page. **You still need to tell your courier** (no deliveries 11pm–6am, Good Friday, Easter Sunday, Christmas Day, or before 1pm Anzac Day; signature + ID for 18+) |

**Optional extra 18+ tick box on Stripe's page:** in Stripe → Settings → Business → Public details, set the Terms of Service URL to `https://kingiwines.com/#terms`. Then in Netlify add the environment variable `STRIPE_REQUIRE_AGE_CHECKBOX` = `true` and redeploy.

## Testing on your own computer (optional)

Needs Node.js 18+. Copy `.env.example` to `.env`, add your **test** key, then run:

```
npm install
npx netlify-cli dev
```

## Notes

- The page is built with the Claude Design runtime (`public/support.js`) and a local copy of React 18.3.1 (`public/vendor/`). Changes made in the design project need re-exporting into `public/index.html`.
- The phone layout is handled by `public/site.css`.
- Wine bottle photos are blurred with "Pre-order" tags. To unblur at launch, remove `filter:blur(…)` from the bottle images in `public/index.html`.
