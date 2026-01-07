import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  UserPlus,
  ShieldCheck,
  ShieldX,
  Home,
  MessageSquare,
  CreditCard
} from 'lucide-react';

interface EmailTest {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const emailTests: EmailTest[] = [
  {
    type: 'welcome',
    name: 'Welcome Email',
    description: 'Sent to new users after signup',
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    type: 'verification_approved',
    name: 'Verification Approved',
    description: 'Sent when identity verification is approved',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    type: 'verification_rejected',
    name: 'Verification Rejected',
    description: 'Sent when identity verification needs retry',
    icon: <ShieldX className="h-5 w-5" />,
  },
  {
    type: 'match',
    name: 'Property Match',
    description: 'Sent when a property matches investor criteria',
    icon: <Home className="h-5 w-5" />,
  },
  {
    type: 'message',
    name: 'New Message',
    description: 'Sent when user receives a message',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    type: 'purchase',
    name: 'Purchase Confirmation',
    description: 'Sent after subscription or credit purchase',
    icon: <CreditCard className="h-5 w-5" />,
  },
];

export function AdminEmailTesting() {
  const [testingEmail, setTestingEmail] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, 'success' | 'error' | null>>({});

  const sendTestEmail = async (type: string) => {
    setTestingEmail(type);
    setResults(prev => ({ ...prev, [type]: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('test-email', {
        body: { type },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send test email');
      }

      setResults(prev => ({ ...prev, [type]: 'success' }));
      toast.success(`Test ${type} email sent! Check your inbox.`);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setResults(prev => ({ ...prev, [type]: 'error' }));
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setTestingEmail(null);
    }
  };

  const sendAllTests = async () => {
    for (const test of emailTests) {
      await sendTestEmail(test.type);
      // Wait 2 seconds between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Email Notification Testing</CardTitle>
              <CardDescription>
                Send test emails to verify all notifications are working correctly
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={sendAllTests}
            disabled={testingEmail !== null}
          >
            <Send className="h-4 w-4 mr-2" />
            Test All Emails
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Test emails will be sent to your account email address. 
            Emails are sent from <code className="bg-muted px-1 rounded">@resend.dev</code> which is a test domain. 
            For production, you'll need to verify your own domain at{' '}
            <a 
              href="https://resend.com/domains" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              resend.com/domains
            </a>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {emailTests.map((test) => (
            <Card key={test.type} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {test.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => sendTestEmail(test.type)}
                    disabled={testingEmail !== null}
                  >
                    {testingEmail === test.type ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test
                      </>
                    )}
                  </Button>

                  {results[test.type] === 'success' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Sent
                    </Badge>
                  )}
                  {results[test.type] === 'error' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
