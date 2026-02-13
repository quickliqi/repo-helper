---
description: Generate a new institutional-grade Authority Engine article for the QuickLiqi blog.
---

# Generate Authority Article

This workflow creates a new blog article that conforms to QuickLiqi's Authority Engine standards. It generates both the `BlogArticle.tsx` entry (full article content) and the `Blog.tsx` entry (post card).

## Prerequisites

- The topic must be relevant to real estate wholesaling, investing, or platform operations.
- You must have read `src/pages/BlogArticle.tsx` and `src/pages/Blog.tsx` to understand the current data schema.

## Inputs (Ask the user)

1. **Topic:** The subject of the article (e.g., "Title Insurance", "Novation Agreements").
2. **Tier:** Content depth level:
   - `1` = Foundational Standard (Core SOPs)
   - `2` = Advanced Execution (Complex structuring)
   - `3` = Market Intelligence (Data signals, cycle commentary)
   - `4` = Platform Documentation (Technical docs)
3. **Category:** One of: `Underwriting`, `Capital Structure`, `Acquisition Ops`, `Risk Management`, `Disposition Ops`, `Market Intelligence`, `Platform Docs`.

## Steps

### 1. Run the scaffold generator

// turbo

```bash
npx tsx scripts/generate-article.ts
```

Follow the interactive prompts to provide Topic, Tier, and Category. The script will output:

- A `BLOG_POSTS` entry (for `Blog.tsx`)
- An `ARTICLES` entry skeleton (for `BlogArticle.tsx`)
- A suggested slug, title, and meta description

### 2. Copy the `BLOG_POSTS` entry

Open `src/pages/Blog.tsx` and add the generated entry to the `BLOG_POSTS` array. Choose an appropriate Lucide icon.

### 3. Write the full article content

Open `src/pages/BlogArticle.tsx` and add a new key to the `ARTICLES` record using the generated slug. Write the article content following these **Authority Engine Rules**:

#### Vocabulary Audit

- **BANNED:** "Financial Freedom", "Passive Income", "Easy", "Secrets", "Tips", "Hacks", "Hustle", cheerleading language.
- **APPROVED:** "Protocol", "Standard", "Mechanics", "Volume", "Risk Mitigation", "Operational", "Infrastructure".
- **Tone:** Avoid instructional tone. Maintain operational framing. Do NOT sound like a compliance PDF—keep it precise but alive.

#### Structural Requirements

- **Headline Format:** `[Operational Concept]: [Execution Standard]`
- **Body Structure:** Standard → Protocol → Risk
- **No Fluff:** Start immediately with the definition/standard. No "Have you ever wondered..." intros.
- **Data Injection:** Every article must contain at least one specific metric or formula.
- **Marketplace Hook:** Every article must contain a "QuickLiqi Marketplace Standard" callout block.

#### Tier-Specific Rules

- **Tier 1-2:** Use `<CheckCircle2>` for marketplace standards, `<AlertTriangle>` for risk warnings.
- **Tier 3 (Market Intelligence):** Include `<MarketDataWidget mode="market" />` at top. Include data snapshot metrics (grid of stats). Include a "Risk Warning" block with `<AlertTriangle>`.
- **Tier 2-3:** The `<RiskDisclaimer />` component is automatically injected by `BlogArticle.tsx` for these tiers.

### 4. Verify the build

// turbo

```bash
npm run build
```

Ensure zero errors before proceeding.

### 5. Visual check

// turbo

```bash
npm run dev
```

Navigate to `/blog` and verify:

- The new post card appears with correct tier badge and category.
- Click through to the article and verify the content tone is "Institutional".
- For Tier 2/3, verify the `RiskDisclaimer` component renders.
- For Tier 3, verify the `MarketDataWidget` renders.

### 6. Tone Validation Checklist

Before marking complete, verify:

- [ ] **Operational Framing:** No instructional "you should" tone.
- [ ] **No cheerleading:** No "You can do it!" language.
- [ ] **Data Hook:** Article references at least one specific metric.
- [ ] **Risk Focus:** Article explains failure scenarios.
- [ ] **Compliance:** Disclaimer is present for Tier 2/3.
