# Workflow: Public Records Data Triangulation Engine

## Description
This workflow builds a multi-source data validation engine. It integrates Regrid and Estated API stubs, builds a "Diff Engine" to compare public records against Zillow data, updates the TypeScript interfaces, builds a React UI validation widget, and updates the AI Deal Analyst's system prompt to handle data discrepancies.

---

## Stage 1: Backend Infrastructure & Diff Engine
**Goal:** Create the utility to fetch and compare multiple data sources.
**Agent Role:** Senior Deno & Supabase Backend Architect

### Step 1.1: Create the Data Aggregation Utility
**Context:** We need a shared utility to handle third-party API calls to Regrid and Estated, and a Diff Engine to compare them against the primary listing data.
**Instructions:**
1. Create a new file at `supabase/functions/_shared/dataTriangulation.ts`.
2. Define the exact JSON structure for the Diff Engine output:
   ```typescript
   export interface DataIntegrity {
     confidence_score: number;
     verified_matches: Record<string, any>;
     discrepancies: Record<string, { source_a: any, source_b: any }>;
   }
   ```
3. Create a function `fetchPublicRecords(address: string, baseData: any): Promise<DataIntegrity>`.
4. Implement skeleton fetch calls for Regrid and Estated (using `Deno.env.get('REGRID_API_KEY')` and `Deno.env.get('ESTATED_API_KEY')`). If keys are missing, return mock comparison data for testing.
5. Implement the Diff Engine logic inside this function: compare `baseData.sqft`, `baseData.price`, and `baseData.bedrooms` against the mock/fetched public records. Populate `verified_matches` where they align, and `discrepancies` where they differ. Calculate a `confidence_score` (0-100).

### Step 1.2: Inject Triangulation into Live Market Deals
**Context:** The `live-market-deals` edge function must now return the triangulated data alongside the raw Zillow properties.
**Instructions:**
1. Open `supabase/functions/live-market-deals/index.ts`.
2. Import the `fetchPublicRecords` function from `../_shared/dataTriangulation.ts`.
3. In the mapping loop for `data.props`, wrap the API calls in a `Promise.all` to fetch public records concurrently for each property extracted from Zillow.
4. Attach the resulting `DataIntegrity` object to the mapped property object under the key `data_integrity`.

---

## Stage 2: Frontend Data Architecture
**Goal:** Type the new data structures and prepare the global state.
**Agent Role:** Senior TypeScript Engineer

### Step 2.1: Update Deal Types
**Context:** The frontend needs to strictly type the new `data_integrity` object flowing in from the backend.
**Instructions:**
1. Open `src/types/deal-analyzer-types.ts` and `src/types/deal-types.ts`.
2. Export a new interface `DataIntegrity` matching the backend structure (`confidence_score`, `verified_matches`, `discrepancies`).
3. Update the `DealDetail` and `Deal` interfaces to include an optional property: `integrity?: DataIntegrity`.

### Step 2.2: Update Scraper Pipeline
**Context:** The `Scraper.tsx` file processes raw deals and maps them. We must ensure the integrity object passes through to the UI.
**Instructions:**
1. Open `src/pages/Scraper.tsx`.
2. Locate the `handleScrape` function and the `enrichedDeals` mapping logic.
3. Ensure that `data_integrity: deal.data_integrity` is explicitly mapped and preserved when constructing the final objects passed to `setResults()`.

---

## Stage 3: Frontend UI / UX
**Goal:** Build the visual Data Integrity Widget for the property modal.
**Agent Role:** Senior React UI/UX Expert

### Step 3.1: Build the Data Integrity Widget
**Context:** We need a clean, trust-building UI component to display verified data and highlight mismatches.
**Instructions:**
1. Create a new component at `src/components/deals/DataIntegrityWidget.tsx`.
2. The component must accept `integrity: DataIntegrity` as a prop.
3. Use Tailwind CSS, Lucide-React icons (`ShieldCheck` for matches, `ShieldAlert` for discrepancies), and `src/components/ui/badge.tsx`.
4. Render a "Confidence Score" progress bar.
5. Map over `integrity.verified_matches` and render them as green-tinted badges.
6. Map over `integrity.discrepancies` and render them in a prominent, yellow-tinted "Caution" split-view layout showing the difference between Source A and Source B.

### Step 3.2: Integrate into Deal Modal
**Context:** The widget needs to be visible before the user interacts with the AI.
**Instructions:**
1. Open `src/components/modals/DealAnalyzerModal.tsx`.
2. Import `DataIntegrityWidget`.
3. Locate the top section of the modal layout (below the property title/price but above the chat interface).
4. Conditionally render `<DataIntegrityWidget integrity={deal.integrity} />` if the `integrity` object exists on the active deal.

---

## Stage 4: AI Prompt Engineering
**Goal:** Instruct the AI Deal Analyst to act as a conservative underwriter when data mismatches occur.
**Agent Role:** Prompt Engineering Specialist

### Step 4.1: Update the Deal Analyzer System Prompt
**Context:** The AI needs to explicitly acknowledge the `data_integrity` object when calculating numbers.
**Instructions:**
1. Open `supabase/functions/deal-analyzer/index.ts`.
2. Locate the `buildDealSystemPrompt` function.
3. Add a new strict instruction to the prompt context:
   "DATA INTEGRITY PROTOCOL: You have been provided a 'data_integrity' object containing discrepancies between county records and listing data. If discrepancies exist (e.g., differing square footage or assessed values), you MUST explicitly warn the user. You MUST use the most conservative number (e.g., the lower ARV, the smaller square footage) for your baseline MAO and ROI calculations to protect the wholesaler's margins."
4. Ensure the `data_integrity` object from the request payload is formatted into the stringified context fed to the Gemini model.
