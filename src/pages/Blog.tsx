import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  Search,
  TrendingUp,
  Calculator,
  Handshake,
  FileSearch,
  Lightbulb,
  Bot,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Scale,
  GanttChartSquare,
  Network,
  Signal
} from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  icon: React.ReactNode;
  featured?: boolean;
  tier: 1 | 2 | 3 | 4;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'market-q3',
    slug: 'market-liquidity-report-q3',
    title: 'Market Intelligence: Q3 Liquidity Shifts & Buy Box Contraction',
    excerpt: 'Executive Signal: Cash buyers are tightening criteria on pre-1980 assets. Disposition times increasing for unrenovated inventory.',
    category: 'Market Intelligence',
    readTime: 6,
    icon: <Signal className="h-6 w-6" />,
    featured: true,
    tier: 3
  },
  {
    id: '1',
    slug: 'deal-analysis-fundamentals',
    title: 'Deal Evaluation Standard: The 70% ARV Protocol',
    excerpt: 'QuickLiqi\'s algorithmic underwriting standard for marketplace listing approval. Maximum Allowable Offer (MAO) logic and margin verification.',
    category: 'Underwriting',
    readTime: 12,
    icon: <Calculator className="h-6 w-6" />,
    featured: true,
    tier: 1
  },
  {
    id: '2',
    slug: 'creative-financing-strategies',
    title: 'Liquidity Structuring: Creative Financing & Subject-To',
    excerpt: 'Deploy capital into high-leverage assets. Structuring subject-to agreements, seller financing terms, and hybrid liquidity positions.',
    category: 'Capital Structure',
    readTime: 15,
    icon: <Scale className="h-6 w-6" />,
    featured: true,
    tier: 2
  },
  {
    id: '3',
    slug: 'finding-and-sourcing-deals',
    title: 'Deal Flow Architecture: Pipeline Generation SOPs',
    excerpt: 'Operationalize off-market acquisition. Data-driven sourcing, probate vectors, and direct-to-vendor pipeline management.',
    category: 'Acquisition Ops',
    readTime: 10,
    icon: <Network className="h-6 w-6" />,
    tier: 1
  },
  {
    id: '4',
    slug: 'due-diligence-closing',
    title: 'Risk Mitigation: Due Diligence & Closing Logic',
    excerpt: 'Asset verification protocols. Title hygiene, physical audit standards, and contingency frameworks for capital protection.',
    category: 'Risk Management',
    readTime: 14,
    icon: <ShieldCheck className="h-6 w-6" />,
    tier: 2
  },
  {
    id: '5',
    slug: 'ai-deal-analyzer-guide',
    title: 'Algorithmic Underwriting: Platform Analyzer Docs',
    excerpt: 'Technical documentation for QuickLiqi\'s AI underwriting engine. Understanding automated risk scoring and yield projection models.',
    category: 'Platform Docs',
    readTime: 8,
    icon: <Bot className="h-6 w-6" />,
    tier: 4
  },
  {
    id: '6',
    slug: 'negotiation-tactics',
    title: 'Counterparty Negotiation: Settlement Protocols',
    excerpt: 'Zero-sum negotiation frameworks for distressed asset acquisition. Psychological leverage points and contract settlement mechanics.',
    category: 'Acquisition Ops',
    readTime: 11,
    icon: <Handshake className="h-6 w-6" />,
    tier: 2
  },
  {
    id: '7',
    slug: 'building-buyers-list',
    title: 'Disposition Network: Liquidity Provider Integration',
    excerpt: 'Systematizing exit velocity. Integrating qualified institutional buyers and high-volume operators into your disposition workflow.',
    category: 'Disposition Ops',
    readTime: 9,
    icon: <GanttChartSquare className="h-6 w-6" />,
    tier: 1
  },
];

const CATEGORIES = ['All', 'Market Intelligence', 'Underwriting', 'Capital Structure', 'Acquisition Ops', 'Risk Management', 'Disposition Ops', 'Platform Docs'];

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = BLOG_POSTS.filter(post => post.featured);

  return (
    <MainLayout>
      <Helmet>
        <title>QuickLiqi Knowledge Base & Market Intelligence</title>
        <meta name="description" content="Institutional-grade real estate investing protocols. Access operational SOPs, market liquidity signals, and underwriting standards for wholesalers and investors." />
      </Helmet>

      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto px-4 py-16 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="h-3 w-3 mr-1" />
              SOPs & Market Signal
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Institutional-Grade Deal Execution
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Operational protocols, underwriting standards, and liquidity structuring for professional asset acquisition.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search protocols & intelligence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Featured Posts */}
          {!searchQuery && selectedCategory === 'All' && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Featured Protocols
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className={`h-full hover:shadow-lg transition-all group border-l-4 ${post.tier === 3 ? 'border-l-accent' : 'border-l-primary/50'
                      }`}>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={post.tier === 3 ? "destructive" : "secondary"}>
                            {post.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime} min read
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg w-fit mb-3 ${post.tier === 3 ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                          }`}>
                          {post.icon}
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-3">
                          {post.excerpt}
                        </CardDescription>
                        <div className="mt-4 flex items-center text-primary text-sm font-medium">
                          View Protocol
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* All Posts */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {selectedCategory === 'All' ? 'All Protocols' : selectedCategory}
            </h2>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No protocols found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className={`hover:shadow-md hover:border-primary/20 transition-all group ${post.tier === 3 ? 'bg-accent/5 border-l-4 border-l-accent' : ''
                      }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0 ${post.tier === 3 ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                            }`}>
                            {post.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {post.tier === 3 ? (
                                <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
                                  Signal
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Tier {post.tier}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.readTime} min read
                              </span>
                            </div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                              {post.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.excerpt}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="py-12">
                <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ready to Validate Asset Viability?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Run prospective assets through our AI underwriting engine to verify marketplace compliance.
                </p>
                <Button asChild size="lg">
                  <Link to="/marketplace">
                    Access Deal Flow
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
