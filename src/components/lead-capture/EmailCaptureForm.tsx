import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useUTM } from '@/hooks/useUTM';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowRight, Gift, CheckCircle2 } from 'lucide-react';

interface EmailCaptureFormProps {
  leadType: 'investor' | 'wholesaler' | 'general';
  landingPage?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showNameField?: boolean;
  benefits?: string[];
  onSuccess?: () => void;
  variant?: 'card' | 'inline';
}

export function EmailCaptureForm({
  leadType,
  landingPage,
  title = "Get Exclusive Access",
  subtitle = "Enter your email to get started",
  buttonText = "Get Started Free",
  showNameField = false,
  benefits,
  onSuccess,
  variant = 'card',
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { utmParams } = useUTM();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('email_leads')
        .insert({
          email,
          full_name: fullName || null,
          lead_type: leadType,
          landing_page: landingPage || window.location.pathname,
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_term: utmParams.utm_term,
          utm_content: utmParams.utm_content,
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicate email - still send to signup
          toast.success("Welcome back! Let's get you signed up.");
        } else {
          throw error;
        }
      } else {
        toast.success('Thanks! Redirecting to signup...');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to auth with prefilled data
        const params = new URLSearchParams({
          mode: 'signup',
          role: leadType === 'general' ? 'investor' : leadType,
          email: email,
        });
        if (fullName) params.set('name', fullName);
        navigate(`/auth?${params.toString()}`);
      }
    } catch (error) {
      console.error('Error capturing lead:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showNameField && (
        <Input
          type="text"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-12"
        />
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 pl-10"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={isLoading} className="h-12">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </form>
  );

  if (variant === 'inline') {
    return formContent;
  }

  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        
        {benefits && benefits.length > 0 && (
          <ul className="space-y-2 mb-6">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
        
        {formContent}
      </CardContent>
    </Card>
  );
}
