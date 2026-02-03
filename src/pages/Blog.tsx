import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'deal-analysis-fundamentals',
    title: 'Deal Analysis Fundamentals: How to Evaluate Any Real Estate Deal',
    excerpt: 'Master the art of analyzing wholesale deals. Learn the MAO formula, ARV calculations, repair cost estimation, and profit margin analysis that separates successful investors from the rest.',
    category: 'Deal Analysis',
    readTime: 12,
    icon: <Calculator className="h-6 w-6" />,
    featured: true,
  },
  {
    id: '2',
    slug: 'creative-financing-strategies',
    title: 'Creative Financing Strategies: Subject-To, Seller Finance & More',
    excerpt: 'Unlock deals that traditional financing can\'t touch. Learn how to structure subject-to agreements, seller financing terms, lease options, and hybrid creative finance deals.',
    category: 'Creative Finance',
    readTime: 15,
    icon: <Lightbulb className="h-6 w-6" />,
    featured: true,
  },
  {
    id: '3',
    slug: 'finding-and-sourcing-deals',
    title: 'Finding & Sourcing Wholesale Deals: A Complete Guide',
    excerpt: 'Build a consistent deal pipeline with proven marketing strategies, lead generation techniques, and relationship building tactics that top wholesalers use.',
    category: 'Deal Sourcing',
    readTime: 10,
    icon: <Search className="h-6 w-6" />,
  },
  {
    id: '4',
    slug: 'due-diligence-closing',
    title: 'Due Diligence & Closing: Protect Yourself and Close More Deals',
    excerpt: 'Navigate title searches, property inspections, contract contingencies, and closing procedures like a pro. Avoid the costly mistakes that sink most deals.',
    category: 'Due Diligence',
    readTime: 14,
    icon: <FileSearch className="h-6 w-6" />,
  },
  {
    id: '5',
    slug: 'ai-deal-analyzer-guide',
    title: 'How to Use Our AI Deal Analyzer for Maximum Profit',
    excerpt: 'Leverage QuickLiqi\'s AI-powered deal analyzer to instantly evaluate properties, identify red flags, and calculate potential returns with precision accuracy.',
    category: 'Platform Guide',
    readTime: 8,
    icon: <Bot className="h-6 w-6" />,
    featured: true,
  },
  {
    id: '6',
    slug: 'negotiation-tactics',
    title: 'Negotiation Tactics That Win Deals',
    excerpt: 'Learn proven negotiation strategies that create win-win scenarios. From initial offers to final terms, master the psychology of successful real estate negotiations.',
    category: 'Negotiation',
    readTime: 11,
    icon: <Handshake className="h-6 w-6" />,
  },
  {
    id: '7',
    slug: 'building-buyers-list',
    title: 'Building a Cash Buyer List That Closes Deals Fast',
    excerpt: 'Your buyers list is your most valuable asset. Learn how to find, qualify, and nurture relationships with serious cash buyers who close quickly.',
    category: 'Deal Sourcing',
    readTime: 9,
    icon: <TrendingUp className="h-6 w-6" />,
  },
];

const CATEGORIES = ['All', 'Deal Analysis', 'Creative Finance', 'Deal Sourcing', 'Due Diligence', 'Negotiation', 'Platform Guide'];

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
      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto px-4 py-16 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <BookOpen className="h-3 w-3 mr-1" />
              Education Center
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Master Wholesale Real Estate
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Learn deal analysis, creative financing, negotiation tactics, and how to find deals that make money for everyone involved.
            </p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
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
                Featured Articles
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all group">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime} min read
                          </span>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg w-fit text-primary mb-3">
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
                          Read Article
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
              {selectedCategory === 'All' ? 'All Articles' : selectedCategory}
            </h2>
            
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No articles found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="hover:shadow-md hover:border-primary/20 transition-all group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                            {post.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {post.category}
                              </Badge>
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
                  Ready to Analyze Your Next Deal?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Use our AI-powered deal analyzer to instantly evaluate any property and see if it meets marketplace standards.
                </p>
                <Button asChild size="lg">
                  <Link to="/marketplace">
                    Browse Marketplace
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
