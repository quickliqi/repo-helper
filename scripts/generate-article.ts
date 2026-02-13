#!/usr/bin/env npx tsx
/**
 * QuickLiqi Authority Engine — Article Scaffold Generator
 *
 * Generates a new article scaffold conforming to the Authority Engine standards.
 * Outputs ready-to-paste code for both Blog.tsx and BlogArticle.tsx.
 *
 * Usage:
 *   npx tsx scripts/generate-article.ts
 *   npx tsx scripts/generate-article.ts --topic "Title Insurance" --tier 2 --category "Risk Management"
 */

import * as readline from 'readline';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    'Underwriting',
    'Capital Structure',
    'Acquisition Ops',
    'Risk Management',
    'Disposition Ops',
    'Market Intelligence',
    'Platform Docs',
] as const;

type Category = (typeof CATEGORIES)[number];
type Tier = 1 | 2 | 3 | 4;

const TIER_LABELS: Record<Tier, string> = {
    1: 'Foundational Standard',
    2: 'Advanced Execution',
    3: 'Market Intelligence',
    4: 'Platform Documentation',
};

const CATEGORY_ICONS: Record<Category, string> = {
    'Underwriting': 'Calculator',
    'Capital Structure': 'Scale',
    'Acquisition Ops': 'Network',
    'Risk Management': 'ShieldCheck',
    'Disposition Ops': 'GanttChartSquare',
    'Market Intelligence': 'Signal',
    'Platform Docs': 'Bot',
};

const BANNED_WORDS = [
    'financial freedom',
    'passive income',
    'easy',
    'secrets',
    'tips',
    'hacks',
    'hustle',
    'guru',
    'simple',
    'guaranteed',
    'no money down',
    'get rich',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

function estimateReadTime(tier: Tier): number {
    const ranges: Record<Tier, [number, number]> = {
        1: [8, 12],
        2: [12, 18],
        3: [4, 8],
        4: [6, 10],
    };
    const [min, max] = ranges[tier];
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTitle(topic: string): string {
    // Authority Engine format: [Operational Concept]: [Execution Standard]
    const cleaned = topic.trim();
    if (cleaned.includes(':')) return cleaned; // Already formatted
    return `${cleaned}: Operational Protocol & Standards`;
}

function auditVocabulary(text: string): string[] {
    const violations: string[] = [];
    const lower = text.toLowerCase();
    for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
            violations.push(word);
        }
    }
    return violations;
}

function generateMetaDescription(title: string, category: string): string {
    return `QuickLiqi ${category} protocol. ${title.split(':')[0].trim()} — operational standards, risk controls, and execution metrics for professional real estate operators.`;
}

// ── Interactive Prompt ───────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ── Code Generation ──────────────────────────────────────────────────────────

function generateBlogPostEntry(config: {
    slug: string;
    title: string;
    excerpt: string;
    category: Category;
    tier: Tier;
    readTime: number;
    icon: string;
    featured: boolean;
}): string {
    return `  {
    id: '${config.slug}',
    slug: '${config.slug}',
    title: '${config.title.replace(/'/g, "\\'")}',
    excerpt: '${config.excerpt.replace(/'/g, "\\'")}',
    category: '${config.category}',
    readTime: ${config.readTime},
    icon: <${config.icon} className="h-6 w-6" />,
    featured: ${config.featured},
    tier: ${config.tier}
  },`;
}

function generateArticleEntry(config: {
    slug: string;
    title: string;
    metaDescription: string;
    category: Category;
    tier: Tier;
    readTime: number;
    icon: string;
}): string {
    const marketWidget =
        config.tier === 3
            ? `        <MarketDataWidget mode="market" className="mb-8" />\n\n`
            : '';

    const riskWarning =
        config.tier === 2 || config.tier === 3
            ? `
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-6">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-600 m-0">Risk Warning</p>
            <p className="text-sm text-muted-foreground m-0">
              TODO: Add specific risk factor for this protocol.
            </p>
          </div>
        </div>
`
            : '';

    return `  '${config.slug}': {
    title: '${config.title.replace(/'/g, "\\'")}',
    metaDescription: '${config.metaDescription.replace(/'/g, "\\'")}',
    category: '${config.category}',
    tier: ${config.tier}, // ${TIER_LABELS[config.tier]}
    readTime: ${config.readTime},
    icon: <${config.icon} className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
${marketWidget}        <h2>TODO: Section 1 — Core Standard</h2>
        <p>
          TODO: Define the operational standard. Start with the definition, not an introduction.
          Use declarative sentences. Include at least one specific metric or formula.
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-6">
          <h3 className="text-primary mt-0">Key Formula / Standard</h3>
          <p className="font-mono text-lg">TODO: Insert formula or threshold</p>
          <p className="text-sm text-muted-foreground mb-0">
            TODO: Brief explanation of the formula.
          </p>
        </div>

        <h2>TODO: Section 2 — Execution Protocol</h2>
        <p>
          TODO: Describe the step-by-step operational mechanics.
        </p>
        <ol>
          <li><strong>Step 1:</strong> TODO</li>
          <li><strong>Step 2:</strong> TODO</li>
          <li><strong>Step 3:</strong> TODO</li>
        </ol>

        <h2>TODO: Section 3 — Risk Mitigation</h2>
        <p>
          TODO: What happens when this protocol fails? What are the capital risks?
        </p>
${riskWarning}
        <div className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-lg p-4 my-6">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success m-0">QuickLiqi Marketplace Standard</p>
            <p className="text-sm text-muted-foreground m-0">
              TODO: Define the binary criteria for accepting/rejecting a deal related to this topic.
            </p>
          </div>
        </div>
      </div>
    ),
  },`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);

    // Parse CLI args if provided
    let topic = '';
    let tier: Tier = 1;
    let category: Category = 'Underwriting';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--topic' && args[i + 1]) topic = args[++i];
        if (args[i] === '--tier' && args[i + 1]) tier = parseInt(args[++i]) as Tier;
        if (args[i] === '--category' && args[i + 1]) category = args[++i] as Category;
    }

    // Interactive prompts if not provided via CLI
    if (!topic) {
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║  QuickLiqi Authority Engine — Article Generator  ║');
        console.log('╚══════════════════════════════════════════════════╝\n');

        topic = await prompt('📝 Article Topic (e.g., "Title Insurance Protocols"): ');

        console.log('\n📊 Content Tiers:');
        console.log('   1 = Foundational Standard (Core SOPs)');
        console.log('   2 = Advanced Execution (Complex structuring)');
        console.log('   3 = Market Intelligence (Data signals)');
        console.log('   4 = Platform Documentation (Technical docs)');
        const tierInput = await prompt('\n🎯 Select Tier [1-4]: ');
        tier = parseInt(tierInput) as Tier;
        if (![1, 2, 3, 4].includes(tier)) {
            console.error('❌ Invalid tier. Must be 1-4.');
            process.exit(1);
        }

        console.log('\n📂 Categories:');
        CATEGORIES.forEach((cat, i) => console.log(`   ${i + 1}. ${cat}`));
        const catInput = await prompt('\n📁 Select Category [1-7]: ');
        const catIdx = parseInt(catInput) - 1;
        if (catIdx < 0 || catIdx >= CATEGORIES.length) {
            console.error('❌ Invalid category selection.');
            process.exit(1);
        }
        category = CATEGORIES[catIdx];
    }

    // ── Vocabulary Audit ───────────────────────────────────────────────────
    const violations = auditVocabulary(topic);
    if (violations.length > 0) {
        console.log('\n⚠️  VOCABULARY AUDIT FAILED');
        console.log('   Banned words detected in topic:');
        violations.forEach((v) => console.log(`   ❌ "${v}"`));
        console.log('\n   Rephrase using institutional terminology and try again.');
        process.exit(1);
    }

    // ── Generate ──────────────────────────────────────────────────────────
    const title = formatTitle(topic);
    const slug = slugify(topic);
    const readTime = estimateReadTime(tier);
    const icon = CATEGORY_ICONS[category];
    const metaDescription = generateMetaDescription(title, category);
    const excerpt = `${title.split(':')[0].trim()} — ${TIER_LABELS[tier].toLowerCase()} protocol for professional operators.`;

    console.log('\n────────────────────────────────────────────────────');
    console.log('✅ ARTICLE SCAFFOLD GENERATED');
    console.log('────────────────────────────────────────────────────');
    console.log(`   Slug:     ${slug}`);
    console.log(`   Title:    ${title}`);
    console.log(`   Tier:     ${tier} (${TIER_LABELS[tier]})`);
    console.log(`   Category: ${category}`);
    console.log(`   Icon:     ${icon}`);
    console.log(`   ReadTime: ${readTime} min`);
    console.log(`   Meta:     ${metaDescription}`);
    console.log('────────────────────────────────────────────────────\n');

    // ── Output: Blog.tsx entry ────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 PASTE INTO Blog.tsx → BLOG_POSTS array:');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(
        generateBlogPostEntry({
            slug,
            title,
            excerpt,
            category,
            tier,
            readTime,
            icon,
            featured: tier === 3, // Market Intelligence is auto-featured
        })
    );

    // ── Output: BlogArticle.tsx entry ─────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📋 PASTE INTO BlogArticle.tsx → ARTICLES record:');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(
        generateArticleEntry({
            slug,
            title,
            metaDescription,
            category,
            tier,
            readTime,
            icon,
        })
    );

    // ── Reminders ─────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────');
    console.log('📝 POST-GENERATION CHECKLIST:');
    console.log('────────────────────────────────────────────────────');
    console.log('   1. Replace all TODO placeholders with real content.');
    console.log('   2. Ensure at least ONE specific metric or formula.');
    console.log('   3. Fill in the "QuickLiqi Marketplace Standard" block.');
    if (tier === 2 || tier === 3) {
        console.log('   4. ⚠️  Tier 2/3: RiskDisclaimer auto-injected. Fill risk warning.');
    }
    if (tier === 3) {
        console.log('   5. 📊 Tier 3: MarketDataWidget included. Verify data snapshot.');
    }
    console.log('   6. Run: npm run build');
    console.log('   7. Run: npm run dev → verify at /blog');
    console.log('────────────────────────────────────────────────────\n');
}

main().catch(console.error);
