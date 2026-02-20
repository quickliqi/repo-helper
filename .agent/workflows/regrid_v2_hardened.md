---
description: Scraper Diagnostics & Regrid V2 Schema Integration
---
# Workflow: Scraper Diagnostics & Regrid V2 Schema Integration

## Description
The scraper pipeline is currently failing silently. This workflow hardens the Supabase Edge Functions with strict CORS and error-catching, upgrades the Diff Engine to utilize the official Regrid V2 schema (mapping high-value fields like `parval`, `area_building`, and `mailadd`), and injects aggressive frontend telemetry so the UI explicitly surfaces any API failures.

---

## Stage 1: Edge Function Hardening (The Fix)
**Goal:** Ensure `live-market-deals` never fails silently and always returns properly formatted JSON with CORS headers.
**Agent Role:** Senior Deno & Supabase Backend Architect

### Step 1.1: Fix Live Market Deals Error Handling
**Context:** The `live-market-deals` function is likely crashing due to unhandled Zillow RapidAPI timeouts or missing CORS headers.
**Instructions:**
1. Open `supabase/functions/live-market-deals/index.ts`.
2. Ensure the standard Supabase `corsHeaders` are imported and returned for `OPTIONS` preflight requests.
3. Wrap the RapidAPI fetch logic in a strict `try...catch` block.
4. If `Deno.env.get('RAPIDAPI_KEY')` is missing, return a `200` response with `[]` gracefully and `console.warn`. Do not throw a 500.
5. If the RapidAPI `res.ok` is false, read the error text and return a `500` response containing a strict JSON error object: `{ error: "RapidAPI Error", details: errorText }`.
6. Ensure the mapped return data is a valid JSON array before it exits.

---

## Stage 2: Regrid V2 Schema Upgrade
**Goal:** Map the exact, high-value fields from the Regrid V2 OpenAPI spec into the Diff Engine.
**Agent Role:** Senior Data Engineer

### Step 2.1: Upgrade the Diff Engine
**Context:** We now have the exact Regrid V2 Schema. We need to extract `area_building`, `parval`, `owner`, `mailadd`, `yearbuilt`, and `zoning_description`.
**Instructions:**
1. Open `supabase/functions/_shared/dataTriangulation.ts`.
2. Ensure the URL construction perfectly matches the V2 spec: `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(address)}&token=${regridKey}`
3. Locate the `data.parcels?.features?.length > 0` block. Extract `const countyData = data.parcels.features[0].properties.fields;`.
4. Implement the following precise schema mappings inside the Diff Engine logic:
   - **Square Footage:** Prioritize `countyData.area_building` (total habitable area) over `countyData.sqft` (parcel square feet). Compare this against `baseData.sqft`.
   - **Valuation:** Extract `countyData.parval` (Total Parcel Value) and `countyData.improvval` (Improvement Value). Add to `verified_matches`.
   - **Ownership & Address:** Extract `countyData.owner` and `countyData.mailadd` (Mailing Address).
   - **Zoning & Age:** Extract `countyData.zoning_description` (or fallback to `countyData.zoning`) and `countyData.yearbuilt`. Add to `verified_matches`.
5. Wrap the Regrid fetch in a `try...catch` block that console logs errors but does NOT crash the function (fallback to returning the base `confidence_score` if Regrid fails).

---

## Stage 3: Frontend Telemetry & Fault Tolerance
**Goal:** Force the UI to explicitly tell the user what failed instead of logging blindly to the console.
**Agent Role:** Senior React Developer

### Step 3.1: Aggressive Error Surfacing in Scraper.tsx
**Context:** `src/pages/Scraper.tsx` uses `console.error`, hiding failures. If RapidAPI fails, the user must see the exact error on the screen.
**Instructions:**
1. Open `src/pages/Scraper.tsx`.
2. Locate the `handleScrape` function and the `Promise.all` block.
3. Replace the `console.error` lines with aggressive UI toasts:
   ```typescript
   if (aiHunterResponse.error) {
     toast.error(`AI Hunter Error: ${aiHunterResponse.error.message || 'Check logs'}`);
   }
   if (liveDealsResponse.error) {
     toast.error(`Live Zillow API Error: ${liveDealsResponse.error.message || 'Check Edge Function Logs'}`);
   }
   ```
4. If both rawDeals.length === 0 and the Live API returns empty, AND no explicit errors were thrown, add a specific toast warning: `toast.warning("Both APIs connected successfully, but 0 properties matched your exact filters.");`
5. Ensure `liveDealsResponse.data` safely falls back to `[]` if undefined so it does not break the subsequent calculateDealMetrics mapping.
