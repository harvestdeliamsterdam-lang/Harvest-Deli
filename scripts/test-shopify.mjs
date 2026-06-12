// scripts/test-shopify.mjs
// ---------------------------------------------------------------------------
// Mini-test: checkt of je Client ID + Secret werken.
// Doet verder NIKS aan je winkel. Print alleen de naam van je shop.
//
// Run:  node --env-file=.env.local scripts/test-shopify.mjs
// ---------------------------------------------------------------------------

const STORE = process.env.SHOPIFY_STORE;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("✗ Er mist iets in .env.local (STORE / CLIENT_ID / CLIENT_SECRET).");
  process.exit(1);
}

try {
  // 1. Inloggen: Client ID + Secret inwisselen voor een token
  console.log("→ Inloggen bij Shopify...");
  const tokenRes = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!tokenRes.ok) {
    console.error(`\n✗ Inloggen mislukt (${tokenRes.status}).`);
    console.error("   Meestal betekent dit: app nog niet geïnstalleerd op je winkel.");
    console.error("   Details:", await tokenRes.text());
    process.exit(1);
  }

  const { access_token } = await tokenRes.json();

  // 2. Vraag de naam van je winkel op (simpele leestest)
  const shopRes = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": access_token,
    },
    body: JSON.stringify({ query: `{ shop { name } }` }),
  });

  const data = await shopRes.json();
  if (data.errors) {
    console.error("\n✗ Verbonden, maar geen leesrechten:", JSON.stringify(data.errors));
    console.error("   Check of de scope read_products / read producten aanstaat.");
    process.exit(1);
  }

  console.log(`\n✓ Alles werkt! Verbonden met winkel: "${data.data.shop.name}"`);
  console.log("  Je kunt nu het seed-script draaien.");
} catch (e) {
  console.error("\n✗ Er ging iets mis:", e.message);
  process.exit(1);
}
