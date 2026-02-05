 import { Helmet } from "react-helmet-async";
import { MainLayout } from "@/components/layout/MainLayout";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Target, Users, Zap, Shield, Heart, TrendingUp } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Link } from "react-router-dom";
import founderImage from "@/assets/founder-damien-thomas.png";
 
 const About = () => {
   return (
     <MainLayout>
       <Helmet>
         <title>About Us - QuickLiqi | Real Estate Investment Platform</title>
         <meta
           name="description"
           content="Learn about QuickLiqi's mission to revolutionize real estate wholesaling. Founded by Damien Thomas to connect wholesalers with verified cash buyers instantly."
         />
       </Helmet>
 
       {/* Hero Section */}
       <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
         <div className="container mx-auto px-4">
           <div className="max-w-4xl mx-auto text-center">
             <Badge variant="secondary" className="mb-4">
               Our Story
             </Badge>
             <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
               Connecting Deals with <span className="text-primary">Buyers Who Close</span>
             </h1>
             <p className="text-xl text-muted-foreground mb-8">
               QuickLiqi was built by real estate professionals, for real estate professionals. 
               We understand the hustle because we've lived it.
             </p>
           </div>
         </div>
       </section>
 
       {/* Mission Section */}
       <section className="py-16 bg-background">
         <div className="container mx-auto px-4">
           <div className="max-w-6xl mx-auto">
             <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                 <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
                 <p className="text-lg text-muted-foreground mb-4">
                   We're on a mission to eliminate the friction in real estate wholesaling. 
                   Too many good deals die because wholesalers can't find buyers fast enough, 
                   and too many investors miss out on off-market opportunities.
                 </p>
                 <p className="text-lg text-muted-foreground mb-4">
                   QuickLiqi bridges that gap with intelligent matching, verified buyers, 
                   and a platform designed for speed. We believe every deal deserves a fair shot, 
                   and every investor deserves access to quality opportunities.
                 </p>
                 <p className="text-lg text-muted-foreground">
                   Our goal is simple: <strong className="text-foreground">help you close more deals, faster.</strong>
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <Card className="bg-primary/5 border-primary/20">
                   <CardContent className="p-6 text-center">
                     <Target className="h-10 w-10 text-primary mx-auto mb-3" />
                     <h3 className="font-semibold text-foreground">Precision Matching</h3>
                     <p className="text-sm text-muted-foreground mt-2">
                       AI-powered buy box matching finds the right buyers instantly
                     </p>
                   </CardContent>
                 </Card>
                 <Card className="bg-primary/5 border-primary/20">
                   <CardContent className="p-6 text-center">
                     <Zap className="h-10 w-10 text-primary mx-auto mb-3" />
                     <h3 className="font-semibold text-foreground">Lightning Fast</h3>
                     <p className="text-sm text-muted-foreground mt-2">
                       Average first response in under 24 hours
                     </p>
                   </CardContent>
                 </Card>
                 <Card className="bg-primary/5 border-primary/20">
                   <CardContent className="p-6 text-center">
                     <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                     <h3 className="font-semibold text-foreground">Verified Users</h3>
                     <p className="text-sm text-muted-foreground mt-2">
                       Every buyer is verified with proof of funds
                     </p>
                   </CardContent>
                 </Card>
                 <Card className="bg-primary/5 border-primary/20">
                   <CardContent className="p-6 text-center">
                     <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                     <h3 className="font-semibold text-foreground">$2M+ Matched</h3>
                     <p className="text-sm text-muted-foreground mt-2">
                       Millions in deals facilitated through our platform
                     </p>
                   </CardContent>
                 </Card>
               </div>
             </div>
           </div>
         </div>
       </section>
 
       {/* Founder Section */}
       <section className="py-16 bg-muted/30">
         <div className="container mx-auto px-4">
           <div className="max-w-4xl mx-auto">
             <div className="text-center mb-12">
               <Badge variant="secondary" className="mb-4">
                 Meet the Founder
               </Badge>
               <h2 className="text-3xl font-bold text-foreground">Damien Thomas</h2>
               <p className="text-muted-foreground mt-2">Founder & CEO</p>
             </div>
             
             <Card className="overflow-hidden">
               <CardContent className="p-8 md:p-12">
                 <div className="flex flex-col md:flex-row gap-8 items-center">
                  <img 
                    src={founderImage} 
                    alt="Damien Thomas - Founder & CEO of QuickLiqi" 
                    className="w-40 h-40 rounded-full object-cover shrink-0 border-4 border-primary/20 shadow-lg"
                  />
                   <div>
                     <p className="text-lg text-muted-foreground mb-4">
                       "I started QuickLiqi because I was tired of watching great deals fall through. 
                       As a wholesaler, I knew the pain of having a property under contract with no buyer in sight. 
                       As an investor, I knew the frustration of missing out on deals that were perfect for my criteria."
                     </p>
                     <p className="text-lg text-muted-foreground mb-4">
                       "QuickLiqi is the solution I wish existed when I started. It's built to solve real problems 
                       that real estate professionals face every day. No fluff, no gimmicks—just a platform that 
                       helps you move deals faster."
                     </p>
                     <p className="text-lg text-foreground font-medium">
                       "Our vision is to become the go-to marketplace where every off-market deal finds its perfect buyer, 
                       and every serious investor has access to quality opportunities."
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>
 
       {/* Values Section */}
       <section className="py-16 bg-background">
         <div className="container mx-auto px-4">
           <div className="max-w-6xl mx-auto">
             <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
               <p className="text-muted-foreground max-w-2xl mx-auto">
                 These principles guide everything we do at QuickLiqi
               </p>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8">
               <Card>
                 <CardContent className="p-6">
                   <Users className="h-10 w-10 text-primary mb-4" />
                   <h3 className="text-xl font-semibold text-foreground mb-2">Community First</h3>
                   <p className="text-muted-foreground">
                     We build for our users. Every feature, every update, every decision is made 
                     with wholesalers and investors in mind.
                   </p>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-6">
                   <Shield className="h-10 w-10 text-primary mb-4" />
                   <h3 className="text-xl font-semibold text-foreground mb-2">Trust & Transparency</h3>
                   <p className="text-muted-foreground">
                     Real estate runs on relationships. We verify users, protect data, and create 
                     a marketplace where trust is the foundation.
                   </p>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-6">
                   <Heart className="h-10 w-10 text-primary mb-4" />
                   <h3 className="text-xl font-semibold text-foreground mb-2">Hustle with Heart</h3>
                   <p className="text-muted-foreground">
                     We respect the grind. QuickLiqi is built to amplify your efforts, not replace them. 
                     We're here to help you work smarter.
                   </p>
                 </CardContent>
               </Card>
             </div>
           </div>
         </div>
       </section>
 
       {/* CTA Section */}
       <section className="py-16 bg-primary text-primary-foreground">
         <div className="container mx-auto px-4 text-center">
           <h2 className="text-3xl font-bold mb-4">Ready to Close More Deals?</h2>
           <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
             Join thousands of wholesalers and investors who are already using QuickLiqi 
             to move deals faster.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button asChild size="lg" variant="secondary">
               <Link to="/auth">Get Started Free</Link>
             </Button>
             <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
               <Link to="/pricing">View Pricing</Link>
             </Button>
           </div>
         </div>
       </section>
     </MainLayout>
   );
 };
 
 export default About;