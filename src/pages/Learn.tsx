import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import {
    Bot,
    Phone,
    Store,
    ChevronRight,
    Menu,
    X,
    Target,
    MessageSquare,
    ExternalLink,
    Search,
    FileText,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const sections: Section[] = [
    {
        id: 'ai-hunter',
        title: 'The AI Hunter Engine',
        icon: <Bot className="h-5 w-5" />,
        content: (
            <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-lg text-muted-foreground mb-6">
                    The AI Hunter Engine is your automated deal analysis powerhouse. It evaluates properties
                    against professional wholesale standards and provides instant feedback on deal quality.
                </p>

                <h3 className="flex items-center gap-2 text-foreground">
                    <Target className="h-5 w-5 text-primary" />
                    Setting Up Your Buy Box
                </h3>
                <p>
                    Your buy box defines the criteria for deals you're interested in. To configure it:
                </p>
                <ol>
                    <li>Navigate to <strong>My Buy Box</strong> from the dashboard</li>
                    <li>Set your preferred <strong>property types</strong> (Single Family, Multi-Family, etc.)</li>
                    <li>Define your <strong>price range</strong> and <strong>geographic areas</strong></li>
                    <li>Specify <strong>condition preferences</strong> (turnkey, light rehab, heavy rehab)</li>
                    <li>Set your <strong>minimum ROI requirements</strong></li>
                </ol>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
                    <p className="font-medium text-primary m-0">Pro Tip</p>
                    <p className="text-sm text-muted-foreground m-0 mt-2">
                        The more specific your buy box, the better the AI can match you with relevant deals.
                        You'll receive automatic notifications when new properties match your criteria.
                    </p>
                </div>

                <h3 className="flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Understanding Audit Scores
                </h3>
                <p>
                    Every deal analyzed by the AI Hunter receives an Audit Score from 0-100. This score
                    evaluates multiple factors:
                </p>
                <ul>
                    <li><strong>70% ARV Rule Compliance:</strong> Does the asking price meet the 70% threshold?</li>
                    <li><strong>Equity Percentage:</strong> How much profit margin is available?</li>
                    <li><strong>Data Completeness:</strong> Are all required fields populated?</li>
                    <li><strong>Market Comparison:</strong> How does the ARV compare to recent comps?</li>
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                        <p className="font-bold text-success text-lg m-0">85-100</p>
                        <p className="text-sm text-muted-foreground m-0 mt-1">Excellent Deal</p>
                        <p className="text-xs text-muted-foreground m-0 mt-2">Strong margins, complete data</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                        <p className="font-bold text-amber-600 text-lg m-0">70-84</p>
                        <p className="text-sm text-muted-foreground m-0 mt-1">Good Deal</p>
                        <p className="text-xs text-muted-foreground m-0 mt-2">Meets standards, solid opportunity</p>
                    </div>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="font-bold text-destructive text-lg m-0">Below 70</p>
                        <p className="text-sm text-muted-foreground m-0 mt-1">Does Not Qualify</p>
                        <p className="text-xs text-muted-foreground m-0 mt-2">Price too high or incomplete data</p>
                    </div>
                </div>

                <h3 className="flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Using the Detailed Analysis Chat
                </h3>
                <p>
                    The Detailed Analysis chat box allows you to have a conversation with the AI about any
                    property. You can:
                </p>
                <ul>
                    <li><strong>Ask specific questions:</strong> "What's the estimated repair cost for this property?"</li>
                    <li><strong>Request comparisons:</strong> "How does this compare to similar deals in the area?"</li>
                    <li><strong>Explore scenarios:</strong> "What if I negotiate the price down to $X?"</li>
                    <li><strong>Get clarification:</strong> "Why did this property receive a low audit score?"</li>
                </ul>
                <p>
                    The AI has access to all property data, market comps, and historical trends to provide
                    informed, data-driven responses to help you underwrite deals with confidence.
                </p>
            </div>
        ),
    },
    {
        id: 'contacting-sellers',
        title: 'Contacting Sellers',
        icon: <Phone className="h-5 w-5" />,
        content: (
            <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-lg text-muted-foreground mb-6">
                    Finding the right contact information is crucial for closing deals. The process differs
                    depending on whether you're working with on-market or off-market properties.
                </p>

                <h3 className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    On-Market Scraped Deals
                </h3>
                <p>
                    For properties that were scraped from public listings (MLS, Zillow, etc.), the contact
                    information is readily available:
                </p>
                <ol>
                    <li>Navigate to the property detail page</li>
                    <li>Look for the <strong>"Original Listing"</strong> button</li>
                    <li>Click the button to view the original listing source</li>
                    <li>The listing agent's contact information will be displayed on the original listing</li>
                </ol>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
                    <p className="font-medium text-primary m-0">Quick Tip</p>
                    <p className="text-sm text-muted-foreground m-0 mt-2">
                        The "Original Listing" button links directly to the source where the property was found,
                        whether that's Zillow, Realtor.com, or another platform. This ensures you always have
                        access to the most up-to-date listing agent information.
                    </p>
                </div>

                <h3 className="flex items-center gap-2 text-foreground">
                    <Search className="h-5 w-5 text-primary" />
                    Off-Market Deals
                </h3>
                <p>
                    Off-market properties don't have listing agents, so you'll need to find the owner directly.
                    Here's the recommended approach:
                </p>

                <h4>Step 1: Get the Property Address</h4>
                <p>
                    The property address is displayed on every deal card and detail page. Make note of the
                    complete address including street number, street name, city, state, and ZIP code.
                </p>

                <h4>Step 2: Perform a Skip Trace</h4>
                <p>
                    A skip trace is a process that finds contact information for property owners. You can use
                    services like:
                </p>
                <ul>
                    <li><strong>PropStream:</strong> Comprehensive property data and owner contact info</li>
                    <li><strong>BatchSkipTracing:</strong> Bulk skip tracing for multiple properties</li>
                    <li><strong>TLOxp:</strong> Professional-grade skip tracing service</li>
                    <li><strong>BeenVerified:</strong> Consumer-friendly people search</li>
                </ul>

                <h4>Step 3: Contact the Owner</h4>
                <p>
                    Once you have the owner's phone number:
                </p>
                <ol>
                    <li>Call during business hours (9 AM - 7 PM local time)</li>
                    <li>Introduce yourself professionally</li>
                    <li>Explain you're interested in purchasing their property</li>
                    <li>Ask if they'd be open to discussing a cash offer</li>
                    <li>Be respectful and professional at all times</li>
                </ol>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 my-6">
                    <p className="font-medium text-amber-600 m-0">Important Note</p>
                    <p className="text-sm text-muted-foreground m-0 mt-2">
                        Always comply with local and federal regulations when contacting property owners,
                        including Do Not Call (DNC) list compliance and TCPA regulations. Never use aggressive
                        or deceptive tactics.
                    </p>
                </div>

                <h3>Sample Opening Script</h3>
                <div className="bg-muted border border-border rounded-lg p-4 my-4">
                    <p className="text-sm font-mono m-0">
                        "Hi, my name is [Your Name] and I'm a real estate investor. I noticed your property
                        at [Address] and I'm interested in making a cash offer. Would you be open to having
                        a brief conversation about it?"
                    </p>
                </div>
            </div>
        ),
    },
    {
        id: 'marketplace',
        title: 'The Marketplace',
        icon: <Store className="h-5 w-5" />,
        content: (
            <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-lg text-muted-foreground mb-6">
                    The QuickLiqi Marketplace connects wholesalers with qualified investors, creating a
                    seamless transaction flow from deal posting to assignment.
                </p>

                <h3 className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    For Wholesalers: Posting Deals
                </h3>
                <p>
                    As a wholesaler, you can list your contracted properties on the marketplace:
                </p>

                <h4>Step 1: Navigate to Post a Deal</h4>
                <ol>
                    <li>Click <strong>"Post a Deal"</strong> from your dashboard</li>
                    <li>Fill in all required property information:
                        <ul>
                            <li>Property address and basic details (beds, baths, sqft)</li>
                            <li>After Repair Value (ARV) with supporting comps</li>
                            <li>Estimated repair costs</li>
                            <li>Your asking price</li>
                            <li>Assignment fee (if applicable)</li>
                        </ul>
                    </li>
                    <li>Upload property photos (minimum 3 recommended)</li>
                    <li>Add any additional notes or highlights</li>
                </ol>

                <h4>Step 2: AI Analysis</h4>
                <p>
                    Before your deal goes live, the AI Hunter Engine will analyze it:
                </p>
                <ul>
                    <li>Verify it meets the 70% ARV rule</li>
                    <li>Calculate the equity percentage</li>
                    <li>Assign an Audit Score</li>
                    <li>Flag any missing or questionable data</li>
                </ul>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
                    <p className="font-medium text-primary m-0">Quality Standard</p>
                    <p className="text-sm text-muted-foreground m-0 mt-2">
                        Only deals that meet QuickLiqi's quality standards (Audit Score ≥ 70) will be published
                        to the marketplace. This ensures investors can browse with confidence.
                    </p>
                </div>

                <h4>Step 3: Automatic Matching</h4>
                <p>
                    Once published, your deal is automatically matched with investors whose buy boxes align
                    with your property criteria. Matched investors receive instant notifications.
                </p>

                <h3 className="flex items-center gap-2 text-foreground">
                    <Target className="h-5 w-5 text-primary" />
                    For Investors: Claiming Deals
                </h3>
                <p>
                    As an investor, you can browse the marketplace and claim deals that match your criteria:
                </p>

                <h4>Step 1: Browse the Marketplace</h4>
                <ol>
                    <li>Navigate to <strong>Marketplace</strong> from the main menu</li>
                    <li>Use filters to narrow down properties:
                        <ul>
                            <li>Price range</li>
                            <li>Location</li>
                            <li>Property type</li>
                            <li>Audit Score</li>
                        </ul>
                    </li>
                    <li>Review property cards showing key metrics</li>
                </ol>

                <h4>Step 2: Review Deal Details</h4>
                <p>
                    Click on any property to view:
                </p>
                <ul>
                    <li>Complete property information and photos</li>
                    <li>AI-generated Audit Score and analysis</li>
                    <li>Detailed financial breakdown (ARV, repairs, equity)</li>
                    <li>Wholesaler contact information</li>
                    <li>Property location on map</li>
                </ul>

                <h4>Step 3: Claim or Contact</h4>
                <p>
                    When you find a deal you're interested in:
                </p>
                <ol>
                    <li>Click <strong>"Claim Deal"</strong> to express serious interest</li>
                    <li>Or use <strong>"Contact Wholesaler"</strong> to ask questions first</li>
                    <li>The wholesaler will be notified of your interest</li>
                    <li>Coordinate directly with the wholesaler to finalize terms</li>
                </ol>

                <div className="bg-success/10 border border-success/20 rounded-lg p-4 my-6">
                    <p className="font-medium text-success m-0">Matched Deals</p>
                    <p className="text-sm text-muted-foreground m-0 mt-2">
                        Check your <strong>Matches</strong> page regularly. The AI automatically identifies
                        deals that align with your buy box criteria and notifies you immediately when new
                        matches are found.
                    </p>
                </div>

                <h3>Transaction Flow</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
                    <div className="bg-muted border border-border rounded-lg p-4 text-center">
                        <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">1</span>
                        </div>
                        <p className="font-medium text-sm m-0">Wholesaler Posts</p>
                        <p className="text-xs text-muted-foreground m-0 mt-1">Deal listed on marketplace</p>
                    </div>
                    <div className="bg-muted border border-border rounded-lg p-4 text-center">
                        <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">2</span>
                        </div>
                        <p className="font-medium text-sm m-0">AI Matches</p>
                        <p className="text-xs text-muted-foreground m-0 mt-1">Investors notified</p>
                    </div>
                    <div className="bg-muted border border-border rounded-lg p-4 text-center">
                        <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">3</span>
                        </div>
                        <p className="font-medium text-sm m-0">Investor Claims</p>
                        <p className="text-xs text-muted-foreground m-0 mt-1">Interest expressed</p>
                    </div>
                    <div className="bg-muted border border-border rounded-lg p-4 text-center">
                        <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">4</span>
                        </div>
                        <p className="font-medium text-sm m-0">Deal Closes</p>
                        <p className="text-xs text-muted-foreground m-0 mt-1">Assignment completed</p>
                    </div>
                </div>
            </div>
        ),
    },
];

export default function Learn() {
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        setSidebarOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const currentSection = sections.find(s => s.id === activeSection) || sections[0];

    return (
        <MainLayout>
            <Helmet>
                <title>Knowledge Base | QuickLiqi</title>
                <meta
                    name="description"
                    content="Learn how to use QuickLiqi's AI Hunter Engine, contact sellers, and navigate the marketplace. Complete platform documentation and guides."
                />
                <meta property="og:title" content="Knowledge Base | QuickLiqi" />
                <meta
                    property="og:description"
                    content="Learn how to use QuickLiqi's AI Hunter Engine, contact sellers, and navigate the marketplace."
                />
                <link rel="canonical" href="https://quickliqi.com/learn" />
            </Helmet>

            <div className="bg-background min-h-screen">
                {/* Header */}
                <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
                    <div className="container mx-auto px-4 py-12">
                        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                            Knowledge Base
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl">
                            Everything you need to know about using the QuickLiqi platform to find, analyze,
                            and close wholesale real estate deals.
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="flex gap-8">
                        {/* Sidebar - Desktop */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Sections</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <nav className="space-y-1">
                                            {sections.map((section) => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => scrollToSection(section.id)}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                                                        'hover:bg-muted',
                                                        activeSection === section.id
                                                            ? 'bg-primary/10 text-primary border-l-4 border-primary'
                                                            : 'text-muted-foreground border-l-4 border-transparent'
                                                    )}
                                                >
                                                    {section.icon}
                                                    <span className="flex-1 text-left">{section.title}</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            ))}
                                        </nav>
                                    </CardContent>
                                </Card>
                            </div>
                        </aside>

                        {/* Mobile Sidebar Toggle */}
                        <div className="lg:hidden fixed bottom-6 right-6 z-50">
                            <Button
                                size="lg"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="rounded-full shadow-lg"
                            >
                                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>

                        {/* Mobile Sidebar */}
                        {sidebarOpen && (
                            <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur">
                                <div className="container mx-auto px-4 py-8">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Sections</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <nav className="space-y-1">
                                                {sections.map((section) => (
                                                    <button
                                                        key={section.id}
                                                        onClick={() => scrollToSection(section.id)}
                                                        className={cn(
                                                            'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                                                            'hover:bg-muted',
                                                            activeSection === section.id
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {section.icon}
                                                        <span className="flex-1 text-left">{section.title}</span>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </button>
                                                ))}
                                            </nav>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="space-y-12">
                                {sections.map((section) => (
                                    <section key={section.id} id={section.id} className="scroll-mt-24">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-3 text-2xl">
                                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                                        {section.icon}
                                                    </div>
                                                    {section.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>{section.content}</CardContent>
                                        </Card>
                                    </section>
                                ))}
                            </div>

                            {/* Help CTA */}
                            <Card className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                                <CardContent className="p-8 text-center">
                                    <h3 className="text-2xl font-bold text-foreground mb-3">
                                        Still Have Questions?
                                    </h3>
                                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                        Our support team is here to help. Reach out anytime and we'll get back to you
                                        as quickly as possible.
                                    </p>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        <Button size="lg" asChild>
                                            <a href="mailto:support@quickliqi.com">
                                                <MessageSquare className="h-5 w-5 mr-2" />
                                                Contact Support
                                            </a>
                                        </Button>
                                        <Button size="lg" variant="outline" asChild>
                                            <a href="/blog" target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-5 w-5 mr-2" />
                                                Read Our Blog
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
