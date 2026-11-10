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
  freeFromBottles: 6,          // free shipping at this many bottles or more
  // Courier rates (NZD) for orders under six bottles. The customer picks their region
  // on the Stripe payment page. Check the region against the delivery address before sending.
  regions: [
    { name: "Auckland (incl. Waiheke)", priceNZD: 14 },
    { name: "Rest of North Island",     priceNZD: 18 },
    { name: "South Island",             priceNZD: 23 },
  ],
  label: "NZ courier, signature required (18+)",
};

export const MAX_BOTTLES_PER_WINE = 48;

export const LICENCE_LINE =
  "Kingi Wines Limited · Off-licence 007/OFF/373/2026 · Expires 6 November 2027";
