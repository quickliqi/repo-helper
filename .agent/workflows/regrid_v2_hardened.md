---
description: Scraper Diagnostics & Regrid V2 Schema Integration
---

# Workflow: Scraper Diagnostics & Regrid V2 Schema Integration

## Description
The scraper pipeline is currently failing silently. This workflow hardens the Supabase Edge Functions with strict CORS and error-catching, upgrades the Diff Engine to utilize the official Regrid V2 schema (mapping high-value fields like `parval` and `area_building`), and injects aggressive frontend telemetry so the UI explicitly surfaces any API failures.

---

## Stage 1: Edge Function Hardening (The Fix)
**Goal:** Ensure `live-market-deals` never fails silently and always returns properly formatted JSON with CORS headers.

### Step 1.1: Fix Live Market Deals Error Handling
1. Open `supabase/functions/live-market-deals/index.ts`.
2. Ensure CORS headers are returned for OPTIONS preflight requests.
3. Wrap the RapidAPI fetch in a strict `try...catch` block.
4. If `RAPIDAPI_KEY` is missing, return a `200` with `[]` gracefully.
5. If `res.ok` is false, return a `500` with `{ error: "RapidAPI Error", details: errorText }`.
6. Ensure the mapped return data is valid JSON before exit.

---

## Stage 2: Regrid V2 Schema Upgrade
**Goal:** Map exact high-value fields from the Regrid V2 OpenAPI spec into the Diff Engine.

### Step 2.1: Upgrade the Diff Engine
1. Open `supabase/functions/_shared/dataTriangulation.ts`.
2. Confirm URL: `https://app.regrid.com/api/v2/parcels/address?query=...&token=...`
3. Extract `countyData = data.parcels.features[0].properties.fields`.
4. Map fields:
   - `area_building` (habitable sqft) vs `baseData.sqft` with 5% tolerance
   - `parval` → `verified_matches['County Assessed Value']`
   - `owner` → `verified_matches['Owner of Record']`
   - `zoning_description` / `zoning` → `verified_matches['Zoning']`
5. Wrap Regrid fetch in `try...catch` — fallback to `confidence_score: 50` on failure.

---

## Stage 3: Frontend Telemetry & Fault Tolerance
**Goal:** Surface API failures as UI toasts instead of silent console logs.

### Step 3.1: Aggressive Error Surfacing in Scraper.tsx
1. Open `src/pages/Scraper.tsx`.
2. Replace `console.error` lines with `toast.error(...)`.
3. Add `toast.warning` when 0 deals are returned but no errors thrown.
4. Ensure `liveDealsResponse.data` falls back to `[]` safely.
