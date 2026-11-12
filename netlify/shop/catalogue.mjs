// Kingi Wines shop settings. THIS is what customers are charged.
// If you change a price here, change the matching price in public/index.html too
// so the website shows the same number.
// (Lives outside netlify/functions so Netlify doesn't treat it as a function.)

export const WINES = {
  syrah:    { name: "‘Bell’ Syrah 2026",              priceNZD: 62 },
  cabfranc: { name: "‘Hartley’ Cabernet Franc 2026",  priceNZD: 55 },
  chilled:  { name: "‘Bonnie’ Chilled Red 2026",      priceNZD: 39 },
  rose:     { name: "‘Brae’ Rosé 2026",               priceNZD: 32 },
};

export const SHIPPING = {
  freeFromNZD: 300,            // free shipping when the wine total (before any promo code) is this much or more
  // Courier rates (NZD) for orders under the free-shipping amount. The customer picks their region
  // on the Stripe payment page. Check the region against the delivery address before sending.
  regions: [
    { name: "Auckland (incl. Waiheke)", priceNZD: 14 },
    { name: "Rest of North Island",     priceNZD: 18 },
    { name: "South Island",             priceNZD: 23 },
  ],
  label: "NZ courier, signature required (18+)",
};

// Promo codes that ALSO give free shipping (any order size) when typed in the cart on the site.
// The discount itself (e.g. 15% off) is set up in Stripe > Product catalogue > Coupons.
export const FREE_SHIPPING_PROMO_CODES = ["WHANAU"];

export const MAX_BOTTLES_PER_WINE = 48;

export const LICENCE_LINE =
  "Kingi Wines Limited · Off-licence 007/OFF/373/2026 · Expires 6 November 2027";
