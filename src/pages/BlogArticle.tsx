import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { RiskDisclaimer } from '@/components/blog/RiskDisclaimer';
import { MarketDataWidget } from '@/components/blog/MarketDataWidget';
import { LeadMagnet } from '@/components/blog/LeadMagnet';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Calculator,
  Lightbulb,
  Search,
  FileSearch,
  Bot,
  Handshake,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Signal
} from 'lucide-react';

// Article content database with Tiers and SEO metadata
type ArticleTier = 1 | 2 | 3 | 4;

interface ArticleData {
  title: string;
  metaDescription: string;
  category: string;
  tier: ArticleTier;
  readTime: number;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const ARTICLES: Record<string, ArticleData> = {
  'deal-analysis-fundamentals': {
    title: 'Deal Analysis Fundamentals: How to Evaluate Any Real Estate Deal',
    metaDescription: 'Master the 70% Rule and Maximum Allowable Offer (MAO) formula. A complete guide to underwriting wholesale real estate deals with profitability protection.',
    category: 'Deal Analysis',
    tier: 1, // Foundational
    readTime: 12,
    icon: <Calculator className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <MarketDataWidget mode="fix_flip" className="mb-8" />

        <h2>The Foundation of Profitable Wholesaling</h2>
        <p>
          Before you put a single property under contract, you need to know if it's actually a good deal.
          This isn't about gut feelings—it's about running the numbers and letting math guide your decisions.
        </p>

        <h2>The 70% Rule Explained</h2>
        <p>
          The 70% rule is the cornerstone of wholesale deal analysis. It states that you should pay
          no more than 70% of the After Repair Value (ARV), minus repair costs.
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-6">
          <h3 className="text-primary mt-0">The MAO Formula</h3>
          <p className="font-mono text-lg">MAO = (ARV × 0.70) - Repair Costs - Assignment Fee</p>
          <p className="text-sm text-muted-foreground mb-0">
            MAO = Maximum Allowable Offer
          </p>
        </div>

        <h3>Example Calculation</h3>
        <ul>
          <li><strong>ARV:</strong> $250,000</li>
          <li><strong>Repair Costs:</strong> $40,000</li>
          <li><strong>Your Assignment Fee:</strong> $10,000</li>
          <li><strong>MAO:</strong> ($250,000 × 0.70) - $40,000 - $10,000 = <strong>$125,000</strong></li>
        </ul>

        <LeadMagnet
          title="Download the MAO Calculator"
          description="Get the exact spreadsheet we use to underwrite deals in under 60 seconds."
          buttonText="Get The Calculator"
          className="my-8"
        />

        <h2>Why 70%? The Investor's Perspective</h2>
        <p>
          Your end buyer (the investor) needs room for:
        </p>
        <ul>
          <li><strong>Profit margin:</strong> 15-20% of ARV</li>
          <li><strong>Holding costs:</strong> 5-8% (mortgage, taxes, insurance during rehab)</li>
          <li><strong>Selling costs:</strong> 8-10% (agent commissions, closing costs)</li>
          <li><strong>Contingency buffer:</strong> 5% for unexpected repairs</li>
        </ul>

        <div className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-lg p-4 my-6">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success m-0">QuickLiqi Quality Standard</p>
            <p className="text-sm text-muted-foreground m-0">
              All deals on QuickLiqi must be priced at or below 70% of ARV to ensure they're profitable for all parties.
            </p>
          </div>
        </div>

        <h2>Calculating ARV (After Repair Value)</h2>
        <p>ARV estimation is both art and science. Here's how to get it right:</p>

        <h3>1. Find Comparable Sales (Comps)</h3>
        <ul>
          <li>Same neighborhood (within 0.5 miles)</li>
          <li>Sold within last 3-6 months</li>
          <li>Similar size (±20% square footage)</li>
          <li>Similar bed/bath count</li>
          <li>Similar condition post-repair</li>
        </ul>

        <h3>2. Calculate Price Per Square Foot</h3>
        <p>
          Take 3-5 comps and calculate the average price per square foot. Apply this to your subject
          property's square footage for a baseline ARV.
        </p>

        <h3>3. Adjust for Differences</h3>
        <p>Add or subtract value for:</p>
        <ul>
          <li>Extra bedrooms/bathrooms (+$5,000-15,000)</li>
          <li>Garage vs no garage (+$10,000-25,000)</li>
          <li>Pool (+$10,000-30,000 depending on market)</li>
          <li>Lot size variations</li>
        </ul>

        <h2>Estimating Repair Costs</h2>
        <p>
          Accurate repair estimates separate profitable deals from money pits. Use these rules of thumb:
        </p>

        <h3>Cost Per Square Foot Guidelines</h3>
        <ul>
          <li><strong>Light cosmetic:</strong> $10-15/sqft (paint, flooring, fixtures)</li>
          <li><strong>Medium rehab:</strong> $20-35/sqft (kitchen/bath updates, some systems)</li>
          <li><strong>Heavy rehab:</strong> $40-60/sqft (gut renovation, structural work)</li>
          <li><strong>Full gut:</strong> $75-100+/sqft (down to studs rebuild)</li>
        </ul>

        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-6">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-600 m-0">Pro Tip</p>
            <p className="text-sm text-muted-foreground m-0">
              Always add 10-15% contingency to your repair estimate. Unexpected issues almost always arise during renovation.
            </p>
          </div>
        </div>

        <h2>Red Flags to Watch For</h2>
        <ul>
          <li>Foundation issues (cracks, settling)</li>
          <li>Roof damage or age (15+ years)</li>
          <li>Knob and tube or aluminum wiring</li>
          <li>Polybutylene plumbing</li>
          <li>Environmental issues (mold, asbestos, lead paint)</li>
          <li>Zoning or permit issues</li>
        </ul>

        <h2>Summary: Your Deal Analysis Checklist</h2>
        <ol>
          <li>Calculate ARV using 3-5 comparable sales</li>
          <li>Estimate repair costs (add 15% contingency)</li>
          <li>Apply the 70% rule to find MAO</li>
          <li>Subtract your assignment fee</li>
          <li>Verify the deal works for your end buyer</li>
          <li>Only proceed if numbers work for ALL parties</li>
        </ol>
      </div>
    ),
  },
  'creative-financing-strategies': {
    title: 'Liquidity Structuring: Creative Financing & Subject-To Protocols',
    metaDescription: 'Operational guide to Subject-To, Seller Finance, and Lease Options. Structure high-leverage real estate deals without traditional bank financing.',
    category: 'Capital Structure',
    tier: 2, // Advanced Execution
    readTime: 15,
    icon: <Lightbulb className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>Beyond Traditional Financing</h2>
        <p>
          Creative financing opens doors that traditional bank loans can't. These strategies let you
          acquire properties with little to no money down, help sellers in tough situations, and create
          win-win deals that wouldn't be possible otherwise.
        </p>

        <h2>Subject-To Financing</h2>
        <p>
          In a "subject-to" deal, you take ownership of the property while the existing mortgage
          stays in the seller's name. You make the payments, but the loan isn't transferred.
        </p>

        <h3>When Subject-To Works</h3>
        <ul>
          <li>Seller has little or no equity but needs to sell</li>
          <li>Seller is behind on payments (pre-foreclosure)</li>
          <li>Property won't qualify for traditional financing</li>
          <li>Interest rate on existing loan is favorable</li>
        </ul>

        <LeadMagnet
          title="Creative Financing Contract Templates"
          description="Download our attorney-reviewed Subject-To and Seller Finance addendums."
          buttonText="Download Templates"
          className="my-8"
        />

        <h3>Key Considerations</h3>
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-6">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-600 m-0">Due-on-Sale Clause</p>
            <p className="text-sm text-muted-foreground m-0">
              Most mortgages have a due-on-sale clause that technically allows the lender to call the
              loan due upon transfer. In practice, banks rarely exercise this as long as payments are
              current, but it's a risk to understand.
            </p>
          </div>
        </div>

        <h2>Seller Financing</h2>
        <p>
          The seller becomes the bank, carrying a note on the property instead of receiving all cash
          at closing. This creates incredible flexibility in deal structure.
        </p>

        <h3>Typical Seller Finance Terms</h3>
        <ul>
          <li><strong>Down payment:</strong> 5-20% (negotiable)</li>
          <li><strong>Interest rate:</strong> 4-8% (often lower than hard money)</li>
          <li><strong>Term:</strong> 5-30 years with balloon option</li>
          <li><strong>Amortization:</strong> Often 30 years with 5-7 year balloon</li>
        </ul>

        <h3>Benefits for Sellers</h3>
        <ul>
          <li>Steady monthly income stream</li>
          <li>Tax benefits from installment sale</li>
          <li>Higher overall sale price (often 5-10% premium)</li>
          <li>Security interest in the property</li>
        </ul>

        <h2>Lease Options</h2>
        <p>
          A lease option combines a rental agreement with an option to purchase. You control the
          property without owning it, then either exercise the option or assign it.
        </p>

        <h3>Two Components</h3>
        <ol>
          <li><strong>Lease Agreement:</strong> Standard rental with monthly payments</li>
          <li><strong>Option Agreement:</strong> Right (not obligation) to buy at set price</li>
        </ol>

        <h3>Sandwich Lease Option</h3>
        <p>
          The "sandwich" strategy involves leasing a property with an option, then sub-leasing it
          to a tenant-buyer at a higher rate. You profit from:
        </p>
        <ul>
          <li>Monthly cash flow spread</li>
          <li>Non-refundable option consideration from tenant-buyer</li>
          <li>Spread on purchase price when they exercise</li>
        </ul>

        <h2>Wraparound Mortgages</h2>
        <p>
          A wrap combines elements of subject-to and seller financing. The seller carries a new
          note that "wraps around" the existing mortgage, collecting payments from the buyer while
          continuing to pay the underlying loan.
        </p>

        <h2>Negotiation Tips for Creative Deals</h2>
        <ol>
          <li><strong>Lead with benefits:</strong> Focus on what the seller gains, not what you gain</li>
          <li><strong>Solve their problem:</strong> Listen for pain points and address them directly</li>
          <li><strong>Be transparent:</strong> Creative deals require trust—never hide your intentions</li>
          <li><strong>Use professional documents:</strong> Have an attorney review all paperwork</li>
          <li><strong>Start with motivated sellers:</strong> Creative terms work best when sellers have urgency</li>
        </ol>

        <div className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-lg p-4 my-6">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success m-0">Win-Win Mindset</p>
            <p className="text-sm text-muted-foreground m-0">
              The best creative finance deals solve real problems for sellers while creating profitable
              opportunities for you. If both parties don't benefit, the deal isn't structured right.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  'finding-and-sourcing-deals': {
    title: 'Deal Flow Architecture: Pipeline Generation SOPs',
    metaDescription: 'Systemize your off-market lead generation. Direct mail, driving for dollars, and digital sourcing strategies for consistent wholesale deal flow.',
    category: 'Acquisition Ops',
    tier: 1, // Foundational
    readTime: 10,
    icon: <Search className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>Building a Consistent Deal Pipeline</h2>
        <p>
          The wholesalers who succeed long-term are the ones who master lead generation. A consistent
          pipeline means you're never desperate for deals—and desperation leads to bad decisions.
        </p>

        <h2>Marketing Channels That Work</h2>

        <h3>1. Direct Mail</h3>
        <p>Still one of the most effective channels. Target:</p>
        <ul>
          <li>Absentee owners (landlords who live elsewhere)</li>
          <li>High equity owners (paid off or nearly paid off)</li>
          <li>Pre-foreclosure and tax delinquent lists</li>
          <li>Probate and inheritance situations</li>
          <li>Code violation properties</li>
        </ul>

        <h3>2. Driving for Dollars</h3>
        <p>
          Drive through target neighborhoods looking for distressed properties. Signs include:
        </p>
        <ul>
          <li>Overgrown lawns and neglected landscaping</li>
          <li>Boarded windows or obvious vacancy</li>
          <li>Deferred maintenance visible from the street</li>
          <li>Multiple code violation notices</li>
        </ul>

        <h3>3. Online Marketing</h3>
        <ul>
          <li>PPC ads targeting "sell my house fast" keywords</li>
          <li>SEO-optimized website for organic leads</li>
          <li>Facebook/Instagram ads to distressed seller demographics</li>
          <li>Craigslist "we buy houses" posts</li>
        </ul>

        <h3>4. Networking</h3>
        <p>Build relationships with:</p>
        <ul>
          <li>Real estate agents who handle distressed sales</li>
          <li>Probate attorneys and estate planners</li>
          <li>Property managers with tired landlords</li>
          <li>Other wholesalers (co-wholesaling deals)</li>
          <li>Contractors who see properties needing work</li>
        </ul>

        <h2>Qualifying Motivated Sellers</h2>
        <p>Not every lead is worth pursuing. Ask these questions:</p>
        <ol>
          <li>Why are you selling? (Look for motivation)</li>
          <li>How quickly do you need to sell?</li>
          <li>What's the condition of the property?</li>
          <li>What do you owe on the property?</li>
          <li>What price would you need to walk away?</li>
        </ol>

        <h2>Building Your Buyers List</h2>
        <p>
          Your buyers list is as important as your deal flow. A strong list means quick closes and
          repeat business.
        </p>
        <ul>
          <li>Attend local REI meetups and networking events</li>
          <li>Join Facebook groups for local investors</li>
          <li>Collect buyer info at every property showing</li>
          <li>Partner with hard money lenders (they know active buyers)</li>
          <li>Use QuickLiqi's matching to find verified cash buyers</li>
        </ul>
      </div>
    ),
  },
  'due-diligence-closing': {
    title: 'Risk Mitigation: Due Diligence & Closing Logic',
    metaDescription: 'Protect your capital with rigorous due diligence. Title search, physical inspection protocols, and essential contract contingencies.',
    category: 'Risk Management',
    tier: 2, // Advanced
    readTime: 14,
    icon: <FileSearch className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>Due Diligence Protects Your Profits</h2>
        <p>
          Skipping due diligence is the fastest way to lose money in real estate. Take the time to
          verify everything before you commit.
        </p>

        <h2>Title Search Essentials</h2>
        <p>Always verify:</p>
        <ul>
          <li><strong>Clear title:</strong> No liens, judgments, or encumbrances</li>
          <li><strong>Property taxes:</strong> Current or know the delinquent amount</li>
          <li><strong>HOA liens:</strong> Check for unpaid association dues</li>
          <li><strong>Mechanics liens:</strong> From unpaid contractors</li>
          <li><strong>Ownership verification:</strong> Seller actually owns the property</li>
        </ul>

        <h2>Property Inspection Checklist</h2>
        <h3>Exterior</h3>
        <ul>
          <li>Foundation (cracks, settling, water intrusion)</li>
          <li>Roof condition and age</li>
          <li>Siding and exterior paint</li>
          <li>Windows and doors</li>
          <li>Drainage and grading</li>
        </ul>

        <h3>Interior</h3>
        <ul>
          <li>Electrical system (panel, outlets, wiring type)</li>
          <li>Plumbing (supply lines, drain lines, water heater)</li>
          <li>HVAC systems</li>
          <li>Kitchen and bathrooms</li>
          <li>Flooring, walls, ceilings</li>
        </ul>

        <h2>Contract Contingencies</h2>
        <p>Protect yourself with these essential clauses:</p>
        <ul>
          <li><strong>Inspection contingency:</strong> Right to exit if issues found</li>
          <li><strong>Clear title contingency:</strong> Seller must provide marketable title</li>
          <li><strong>Assignment clause:</strong> Right to assign contract to end buyer</li>
          <li><strong>Access clause:</strong> Right to show property to potential buyers</li>
          <li><strong>Earnest money terms:</strong> Refundable if contingencies not met</li>
        </ul>

        <h2>Closing Process</h2>
        <ol>
          <li>Execute purchase agreement with seller</li>
          <li>Open escrow with title company</li>
          <li>Complete due diligence during contingency period</li>
          <li>Find and assign to end buyer</li>
          <li>Coordinate closing with title company</li>
          <li>Collect assignment fee at closing</li>
        </ol>
      </div>
    ),
  },
  'ai-deal-analyzer-guide': {
    title: 'Algorithmic Underwriting: Platform Analyzer Documentation',
    metaDescription: 'Technical documentation for QuickLiqi AI Deal Analyzer. Learn how our automated risk scoring models validate deals against marketplace standards.',
    category: 'Platform Docs',
    tier: 4, // Docs
    readTime: 8,
    icon: <Bot className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>AI-Powered Deal Analysis</h2>
        <p>
          QuickLiqi's AI deal analyzer takes the guesswork out of evaluating wholesale deals.
          In seconds, you'll know if a property meets marketplace standards and is worth pursuing.
        </p>

        <h2>What the Analyzer Checks</h2>
        <ul>
          <li><strong>70% ARV Rule:</strong> Automatically verifies asking price is at or below 70% of ARV</li>
          <li><strong>Equity Percentage:</strong> Calculates potential profit margin</li>
          <li><strong>Complete Information:</strong> Ensures all required details are provided</li>
          <li><strong>Market Comparison:</strong> Validates ARV against comparable sales data</li>
        </ul>

        <h2>Understanding the Results</h2>

        <h3>Deal Quality Tiers</h3>
        <ul>
          <li><strong>Excellent Deal (≤60% ARV):</strong> Strong margins for all parties</li>
          <li><strong>Good Deal (61-65% ARV):</strong> Solid opportunity with healthy returns</li>
          <li><strong>Fair Deal (66-70% ARV):</strong> Meets minimum standards</li>
          <li><strong>Does Not Qualify (&gt;70% ARV):</strong> Asking price too high</li>
        </ul>

        <h3>Key Metrics Explained</h3>
        <ul>
          <li><strong>Potential Equity:</strong> ARV minus asking price minus estimated repairs</li>
          <li><strong>Equity Percentage:</strong> How much of the ARV is available as profit margin</li>
          <li><strong>ARV Percentage:</strong> Your asking price as a percentage of after repair value</li>
        </ul>

        <h2>Using Results to Negotiate</h2>
        <p>
          If a deal doesn't initially qualify, use the analyzer to find your maximum offer:
        </p>
        <ol>
          <li>Note the maximum allowed price (70% of ARV)</li>
          <li>Present comps data to support your lower offer</li>
          <li>Explain the math—sellers respect educated buyers</li>
          <li>Focus on solving their problem, not just the price</li>
        </ol>

        <div className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-lg p-4 my-6">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-success m-0">Quality Marketplace</p>
            <p className="text-sm text-muted-foreground m-0">
              Every deal on QuickLiqi passes our quality check, so investors can browse with confidence
              knowing all listings meet professional standards.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  'negotiation-tactics': {
    title: 'Counterparty Negotiation: Settlement & Acquisition Protocols',
    metaDescription: 'Zero-sum negotiation frameworks for distressed asset acquisition. Psychological leverage points and contract settlement mechanics.',
    category: 'Acquisition Ops',
    tier: 2, // Advanced
    readTime: 11,
    icon: <Handshake className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>The Psychology of Successful Negotiation</h2>
        <p>
          Great negotiators understand that every deal has two sides. Your goal isn't to "win"—it's
          to create outcomes where both parties feel good about the agreement.
        </p>

        <h2>Before You Negotiate</h2>
        <ol>
          <li><strong>Know your numbers:</strong> Have your MAO calculated before any conversation</li>
          <li><strong>Research the seller:</strong> Understand their motivation and timeline</li>
          <li><strong>Prepare your walk-away point:</strong> Know when to say no</li>
          <li><strong>Have alternatives:</strong> Never negotiate from desperation</li>
        </ol>

        <h2>Key Negotiation Strategies</h2>

        <h3>1. Listen More Than You Talk</h3>
        <p>
          The seller will often tell you exactly what they need. Your job is to listen for pain
          points and then address them directly.
        </p>

        <h3>2. Anchor Appropriately</h3>
        <p>
          The first number mentioned often influences the final outcome. Start with a reasonable
          but favorable anchor, then work toward the middle.
        </p>

        <h3>3. Use Silence</h3>
        <p>
          After making an offer, stop talking. Silence creates pressure and often leads the other
          party to make concessions or reveal information.
        </p>

        <h3>4. Separate People from Problems</h3>
        <p>
          Focus on interests, not positions. "I need $200,000" is a position. "I need to pay off
          my mortgage and have money for a down payment on my next house" is an interest you can
          work with.
        </p>

        <h2>Handling Objections</h2>
        <ul>
          <li><strong>"Your offer is too low":</strong> Show your math. Explain the 70% rule and why it protects both parties.</li>
          <li><strong>"I need to think about it":</strong> Set a follow-up time. Create soft urgency without pressure.</li>
          <li><strong>"I'm getting other offers":</strong> Focus on your unique value—speed, certainty, flexibility.</li>
        </ul>
      </div>
    ),
  },
  'building-buyers-list': {
    title: 'Disposition Network: Liquidity Provider Integration',
    metaDescription: 'Systematize your exit velocity. Build a robust list of qualified institutional buyers and high-volume operators for rapid contract disposition.',
    category: 'Disposition Ops',
    tier: 1, // Foundational
    readTime: 9,
    icon: <TrendingUp className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>Your Buyers List Is Your Business</h2>
        <p>
          A wholesaler without a buyers list is just a person with contracts. Your ability to close
          deals quickly depends entirely on having qualified, active buyers ready to purchase.
        </p>

        <h2>Where to Find Cash Buyers</h2>
        <ul>
          <li><strong>Real estate investor meetups:</strong> Local REI associations and networking groups</li>
          <li><strong>Facebook groups:</strong> Search "[Your City] Real Estate Investors"</li>
          <li><strong>Property auctions:</strong> Buyers at auctions have cash ready to deploy</li>
          <li><strong>Hard money lenders:</strong> They work with active flippers daily</li>
          <li><strong>Landlord associations:</strong> Buy-and-hold investors often buy from wholesalers</li>
          <li><strong>QuickLiqi platform:</strong> Connect with verified investors whose buy boxes match your deals</li>
        </ul>

        <h2>Qualifying Your Buyers</h2>
        <p>Not all buyers are equal. Ask these questions:</p>
        <ol>
          <li>How many properties did you purchase last year?</li>
          <li>What's your typical purchase price range?</li>
          <li>What areas and property types do you target?</li>
          <li>Do you use cash, hard money, or conventional financing?</li>
          <li>How quickly can you close once you find a deal?</li>
          <li>Can you provide proof of funds?</li>
        </ol>

        <h2>Organizing Your List</h2>
        <p>Segment buyers by:</p>
        <ul>
          <li><strong>Investment strategy:</strong> Flip vs. rental vs. BRRRR</li>
          <li><strong>Price range:</strong> Under $100K, $100-200K, $200K+, etc.</li>
          <li><strong>Geographic preference:</strong> Specific neighborhoods or cities</li>
          <li><strong>Property type:</strong> SFR, multi-family, commercial</li>
          <li><strong>Condition preference:</strong> Turnkey vs. heavy rehab</li>
        </ul>

        <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-lg p-4 my-6">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-primary m-0">QuickLiqi Advantage</p>
            <p className="text-sm text-muted-foreground m-0">
              Our platform automatically matches your deals to investors whose buy boxes align with
              your property criteria—no manual list building required.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  'market-liquidity-report-q3': {
    title: 'Market Intelligence Bulletin: Q3 Liquidity Shifts & Buy Box Contraction',
    metaDescription: 'Data-driven analysis of Q3 wholesale disposition trends. Active cash buyer volume, median ARV shifts, and rising inventory age in key markets.',
    category: 'Market Intelligence',
    tier: 3, // Signal
    readTime: 6,
    icon: <Signal className="h-6 w-6" />,
    content: (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <MarketDataWidget mode="market" className="mb-8" />

        <div className="p-4 bg-muted border-l-4 border-primary mb-8">
          <p className="font-bold text-sm text-primary uppercase tracking-widest mb-1">Executive Signal</p>
          <p className="m-0 font-medium">
            Cash buyers are tightening criteria on pre-1980 vintage assets.
            Expect disposition times to increase by 15-20% for unrenovated inventory.
          </p>
        </div>

        <h2>Data Snapshot</h2>
        <p>
          QuickLiqi platform data indicates a measurable shift in investor sentiment entering Q3.
          While overall deal volume remains stable, the <strong>Time to Disposition</strong> has widened for specific asset classes.
        </p>

        <h3>Key Metrics (30-Day Rolling)</h3>
        <ul>
          <li><strong>Median ARV:</strong> Stabilizing at $245k (down 2% MoM)</li>
          <li><strong>Active Buy Boxes:</strong> +12% increase in "Turnkey/Light Rehab" preferences</li>
          <li><strong>Dead Inventory:</strong> Heavy rehab (&gt; $50k est. repair) sitting 14+ days longer</li>
        </ul>

        <h2>Observed Shifts</h2>
        <h3>The "Heavy Lift" Retreat</h3>
        <p>
          Institutional buyers are reducing exposure to deep-renovation projects. Labor shortages and
          material cost volatility have compressed margins on heavy rehabs.
        </p>
        <p>
          <strong>Wholesaler Action:</strong> Adjust your Maximum Allowable Offer (MAO) calculation.
          If estimating &gt;$60/sqft in repairs, increase your investor profit buffer from 15% to 20% to ensure liquidity.
        </p>

        <h3>Regional Liquidity Signals</h3>
        <p>
          Sunbelt markets (FL, TX, AZ) are seeing a surge in "Buy and Hold" demand, while "Fix and Flip"
          demand dominates the Midwest. Know your exit strategy before contracting.
        </p>

        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg my-6">
          <h4 className="text-destructive font-bold flex items-center gap-2 m-0 mb-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Warning
          </h4>
          <p className="text-sm m-0">
            Over-leveraging on projected ARV appreciation is dangerous in this cycle.
            Underwrite to <strong>today's</strong> values, not tomorrow's hopes.
          </p>
        </div>
      </div>
    ),
  }
};

const TIER_LABELS: Record<ArticleTier, { label: string; color: string }> = {
  1: { label: 'Foundational Standard', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  2: { label: 'Advanced Execution', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  3: { label: 'Market Intelligence', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  4: { label: 'Platform Documentation', color: 'bg-zinc-100 text-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-300' },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? ARTICLES[slug] : null;

  if (!article) {
    return (
      <MainLayout>
        <Helmet>
          <title>Article Not Found | QuickLiqi</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="container mx-auto px-4 py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const tierInfo = TIER_LABELS[article.tier];

  return (
    <MainLayout>
      <Helmet>
        <title>{article.title} | QuickLiqi Knowledge Base</title>
        <meta name="description" content={article.metaDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://quickliqi.com/blog/${slug}`} />
        <meta property="og:site_name" content="QuickLiqi" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.metaDescription} />
        <link rel="canonical" href={`https://quickliqi.com/blog/${slug}`} />

        {/* Schema.org markup for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.metaDescription,
            "author": {
              "@type": "Organization",
              "name": "QuickLiqi Research"
            },
            "publisher": {
              "@type": "Organization",
              "name": "QuickLiqi",
              "logo": {
                "@type": "ImageObject",
                "url": "https://quickliqi.com/logo.png"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <Button asChild variant="ghost" className="mb-6">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                {article.category}
              </Badge>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${tierInfo.color}`}>
                {tierInfo.label}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime} min read
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-4 bg-primary/10 rounded-xl text-primary hidden md:block mt-1">
                {article.icon}
              </div>
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {article.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Risk Disclaimer for Tier 2 and 3 Content */}
            {(article.tier === 2 || article.tier === 3) && (
              <RiskDisclaimer />
            )}

            {article.content}

            {/* CTA */}
            <Card className="mt-12 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Ready to Execute?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Turn this protocol into active deal flow on QuickLiqi.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link to="/marketplace">Browse Live Deals</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/blog">More Protocols</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Footer Disclaimer */}
            <div className="mt-8 pt-8 border-t border-border text-center">
              <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                © {new Date().getFullYear()} QuickLiqi. All rights reserved.
                Content provided for operational informational purposes only.
                Does not constitute financial, legal, or investment advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
