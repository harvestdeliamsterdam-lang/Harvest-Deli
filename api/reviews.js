// =============================================================================
// Live Google reviews proxy (Vercel serverless function).
// The homepage "Loved by our customers" section (window.HD_REVIEWS in index.html)
// fetches /api/reviews. This keeps the Google API key SERVER-SIDE (never shipped
// to the browser) and the section falls back to its bundled reviews whenever this
// returns ok:false — so the page always renders even if the API is unconfigured.
//
// Configure in Vercel → Project → Settings → Environment Variables, then redeploy:
//   GOOGLE_PLACES_API_KEY   (required)  a key with "Places API (New)" enabled + billing
//   GOOGLE_PLACE_ID         (optional)  the Harvest Deli place id, e.g. "ChIJ..."
//   GOOGLE_PLACE_QUERY      (optional)  text-search fallback, default below
//
// Returns: { ok, average, count, reviews:[{ text, text_en, name, location }] }
// =============================================================================

var PLACES = 'https://places.googleapis.com/v1';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Edge-cache so we never burn the Places quota: 6h fresh, 1d stale-while-revalidate.
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  var key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) { res.status(200).end(JSON.stringify({ ok: false, reason: 'unconfigured' })); return; }

  try {
    var placeId = process.env.GOOGLE_PLACE_ID;

    // Resolve the place id from a text search when it isn't set explicitly.
    if (!placeId) {
      var q = process.env.GOOGLE_PLACE_QUERY || 'Harvest Deli Amsterdam Ten Katemarkt';
      var s = await fetch(PLACES + '/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id' },
        body: JSON.stringify({ textQuery: q })
      });
      var sj = await s.json();
      placeId = sj && sj.places && sj.places[0] && sj.places[0].id;
      if (!placeId) { res.status(200).end(JSON.stringify({ ok: false, reason: 'place-not-found' })); return; }
    }

    // Place details: rating, total rating count, and up to 5 reviews (Dutch).
    var d = await fetch(PLACES + '/places/' + encodeURIComponent(placeId) + '?languageCode=nl', {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' }
    });
    var pj = await d.json();
    if (!pj || pj.error) { res.status(200).end(JSON.stringify({ ok: false, reason: 'details-failed' })); return; }

    var reviews = (pj.reviews || [])
      .filter(function (r) { return (r.rating || 0) >= 4 && r.text && r.text.text; })
      .sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); })
      .slice(0, 6)
      .map(function (r) {
        return {
          text: (r.text && r.text.text) || '',
          text_en: (r.originalText && r.originalText.text) || (r.text && r.text.text) || '',
          name: (r.authorAttribution && r.authorAttribution.displayName) || 'Google',
          location: r.relativePublishTimeDescription || ''
        };
      });

    res.status(200).end(JSON.stringify({
      ok: reviews.length > 0,
      average: typeof pj.rating === 'number' ? pj.rating : null,
      count: typeof pj.userRatingCount === 'number' ? pj.userRatingCount : null,
      reviews: reviews
    }));
  } catch (e) {
    res.status(200).end(JSON.stringify({ ok: false, reason: 'error' }));
  }
};
