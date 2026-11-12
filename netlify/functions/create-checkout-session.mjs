// Creates a Stripe Checkout Session for the Kingi Wines cart.
// Runs on Netlify, never in the browser, so the Stripe secret key stays private.
// Prices come from catalogue.mjs on the server; the browser only sends wine keys and quantities.

import Stripe from "stripe";
import { WINES, SHIPPING, MAX_BOTTLES_PER_WINE, LICENCE_LINE, FREE_SHIPPING_PROMO_CODES } from "../shop/catalogue.mjs";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set in Netlify environment variables.");
    return json(500, { error: "Checkout isn’t set up yet. Please try again soon." });
  }
  const stripe = new Stripe(secretKey);

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Something went wrong with your cart. Please refresh and try again." }); }

  // Second age check (licence condition d(ii)): the site must confirm age immediately before the sale.
  if (body.ageConfirmed !== true) return json(400, { error: "Please confirm you are 18 or over to place your order." });

  // Validate the cart against the server-side catalogue.
  const items = Array.isArray(body.items) ? body.items : [];
  const merged = new Map();
  for (const item of items) {
    const wine = WINES[item && item.key];
    const qty = Number(item && item.qty);
    if (!wine || !Number.isInteger(qty) || qty < 1) return json(400, { error: "Your cart has an item we don’t recognise. Please refresh and try again." });
    merged.set(item.key, (merged.get(item.key) || 0) + qty);
  }
  if (merged.size === 0) return json(400, { error: "Your cart is empty." });
  for (const [key, qty] of merged) {
    if (qty > MAX_BOTTLES_PER_WINE) return json(400, { error: `The most we can take online is ${MAX_BOTTLES_PER_WINE} bottles of ${WINES[key].name}. Email kingi.wine@gmail.com for larger orders.` });
  }
  const bottles = [...merged.values()].reduce((a, b) => a + b, 0);

  // Shipping: free when the wine total reaches SHIPPING.freeFromNZD, otherwise the customer chooses their region on Stripe's page.
  const subtotalNZD = [...merged].reduce((sum, [key, qty]) => sum + WINES[key].priceNZD * qty, 0);
  const promoTyped = typeof body.promoCode === "string" ? body.promoCode.trim().toUpperCase() : "";
  const freeShipping = subtotalNZD >= SHIPPING.freeFromNZD || FREE_SHIPPING_PROMO_CODES.includes(promoTyped);
  const shippingOptions = (freeShipping
    ? [{ name: `Free shipping: ${SHIPPING.label}`, priceNZD: 0 }]
    : SHIPPING.regions.map(r => ({ name: `${r.name}: ${SHIPPING.label}`, priceNZD: r.priceNZD }))
  ).map(o => ({
    shipping_rate_data: {
      type: "fixed_amount",
      display_name: o.name,
      fixed_amount: { amount: Math.round(o.priceNZD * 100), currency: "nzd" },
    },
  }));

  const siteUrl = (process.env.URL || new URL(req.url).origin).replace(/\/$/, "");
  const email = typeof body.email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email.trim()) ? body.email.trim() : undefined;

  // Optional promo code typed on the site. Codes are created in the Stripe Dashboard (Products > Coupons).
  let discounts;
  const promo = typeof body.promoCode === "string" ? body.promoCode.trim() : "";
  if (promo) {
    try {
      const found = await stripe.promotionCodes.list({ code: promo, active: true, limit: 1 });
      if (!found.data.length) return json(400, { error: `Promo code ${promo.toUpperCase()} isn’t valid. Remove it or try another.` });
      discounts = [{ promotion_code: found.data[0].id }];
    } catch (err) {
      console.error("Promo lookup failed", err);
      return json(502, { error: "We couldn’t check that promo code. Please try again." });
    }
  }

  const params = {
    mode: "payment",
    locale: "en",
    line_items: [...merged].map(([key, qty]) => ({
      quantity: qty,
      price_data: {
        currency: "nzd",
        unit_amount: Math.round(WINES[key].priceNZD * 100),
        product_data: { name: WINES[key].name, metadata: { wine_key: key } },
      },
    })),
    customer_email: email,
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: ["NZ"] },
    shipping_options: shippingOptions,
    // Creates an invoice/receipt that carries the licence details (licence condition e).
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: "Kingi Wines pre-order. Delivered by courier and signed for by someone 18 or over.",
        footer: LICENCE_LINE,
        custom_fields: [
          { name: "Licensee", value: "Kingi Wines Limited" },
          { name: "Licence no.", value: "007/OFF/373/2026" },
          { name: "Licence expires", value: "6 November 2027" },
        ],
      },
    },
    custom_text: {
      submit: { message: "By paying you confirm you are 18 or over. Deliveries must be signed for by someone 18 or over. No deliveries 11pm–6am, Good Friday, Easter Sunday, Christmas Day or before 1pm on Anzac Day." },
    },
    metadata: { age_confirmed_on_site: "yes", bottles: String(bottles) },
    success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
  };

  // Optional: an 18+ tick box on the Stripe payment page as well.
  // Needs a Terms of Service URL saved in Stripe Dashboard > Settings > Public details first.
  if (process.env.STRIPE_REQUIRE_AGE_CHECKBOX === "true") {
    params.consent_collection = { terms_of_service: "required" };
    params.custom_text.terms_of_service_acceptance = {
      message: `I am 18 or over and agree to the [Terms of Service](${siteUrl}/#terms).`,
    };
  }

  if (discounts) params.discounts = discounts;
  else params.allow_promotion_codes = true;

  try {
    const session = await stripe.checkout.sessions.create(params);
    return json(200, { url: session.url });
  } catch (err) {
    console.error("Stripe Checkout error", err && err.message);
    return json(502, { error: "We couldn’t start payment just now. Please try again in a moment." });
  }
};

