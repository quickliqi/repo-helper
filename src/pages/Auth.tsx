import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, TrendingUp, Users, AlertCircle, Eye, EyeOff, CheckCircle2, Plus } from 'lucide-react';
import { AppRole } from '@/types/database';
import { toast } from 'sonner';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (score < 30) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score < 60) return { score, label: 'Fair', color: 'bg-yellow-500' };
  if (score < 80) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score: Math.min(score, 100), label: 'Strong', color: 'bg-green-500' };
};

const ROLE_LABELS: Record<AppRole, string> = {
  investor: 'Investor',
  wholesaler: 'Wholesaler',
  admin: 'Admin',
};

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';
  const addRoleParam = searchParams.get('addRole') as AppRole | null;

  const [mode, setMode] = useState<'signin' | 'signup'>(isSignUp ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('investor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [signupComplete, setSignupComplete] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [showAddRolePrompt, setShowAddRolePrompt] = useState(false);
  const [pendingRole, setPendingRole] = useState<AppRole | null>(addRoleParam);

  const { signUp, signIn, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const passwordStrength = calculatePasswordStrength(password);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (mode === 'signup' && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addRoleToAccount = async (userId: string, roleToAdd: AppRole) => {
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', roleToAdd)
      .maybeSingle();

    if (existingRole) {
      toast.info(`You already have the ${ROLE_LABELS[roleToAdd]} role!`);
      return false;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: roleToAdd });

    if (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role. Please try again.');
      return false;
    }

    if (roleToAdd === 'investor') {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'trialing',
          plan_type: 'investor_pro',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    if (roleToAdd === 'wholesaler') {
      await supabase
        .from('listing_credits')
        .insert({ user_id: userId, credits_remaining: 1, credits_used: 0 });
    }

    await refreshProfile();
    toast.success(`${ROLE_LABELS[roleToAdd]} role added to your account!`);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes('already registered')) {
            setShowAddRolePrompt(true);
            setPendingRole(selectedRole);
            setMode('signin');
            toast.info('This email already has an account. Sign in to add a new role.');
          } else {
            toast.error(error.message);
          }
        } else {
          supabase.functions.invoke('send-welcome-email', {
            body: { email, name: fullName, role: selectedRole },
          }).catch(err => console.error('Failed to send welcome email:', err));

          toast.success('Account created! Let\'s set up your profile.');
          navigate('/profile-setup');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
        } else {
          if (pendingRole) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const added = await addRoleToAccount(user.id, pendingRole);
              if (added) {
                toast.success(`Welcome back! ${ROLE_LABELS[pendingRole]} role has been added.`);
              }
            }
            setPendingRole(null);
            setShowAddRolePrompt(false);
          } else {
            toast.success('Welcome back!');
          }
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      emailSchema.parse(email);
    } catch {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset instructions sent to your email');
      }
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-xl text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent a confirmation email to <strong>{signupEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Click the link in the email to verify your account and get started.
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setSignupComplete(false)}
                className="text-primary hover:underline"
              >
                try again
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-white">
              QuickLiqi
            </span>
          </Link>
        </div>

        <div className="space-y-8">
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Connect with the right deals,<br />
            at the right time.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            The professional marketplace for real estate wholesalers and investors.
            Post deals, set your criteria, and let our matching engine do the rest.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Smart Matching</h3>
                <p className="text-sm text-white/70">Auto-match properties to your criteria</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Verified Users</h3>
                <p className="text-sm text-white/70">Connect with serious buyers & sellers</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">
          Trusted by wholesalers and investors nationwide
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="flex items-center justify-center gap-2 lg:hidden mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                QuickLiqi
              </span>
            </Link>

            <CardTitle className="font-display text-2xl">
              {showAddRolePrompt
                ? `Add ${pendingRole ? ROLE_LABELS[pendingRole] : ''} Role`
                : mode === 'signup'
                  ? 'Create your account'
                  : 'Welcome back'
              }
            </CardTitle>
            <CardDescription>
              {showAddRolePrompt
                ? 'Sign in to add a new role to your existing account'
                : mode === 'signup'
                  ? 'Start matching with real estate opportunities today'
                  : 'Sign in to access your dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showAddRolePrompt && pendingRole && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Adding {ROLE_LABELS[pendingRole]} role</p>
                  <p className="text-xs text-muted-foreground">Sign in to add this role to your account</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddRolePrompt(false);
                    setPendingRole(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                {mode === 'signup' && password.length > 0 && (
                  <div className="space-y-1.5">
                    <Progress value={passwordStrength.score} className={`h-1.5 ${passwordStrength.color}`} />
                    <p className={`text-xs ${passwordStrength.score < 60 ? 'text-muted-foreground' : 'text-green-600'}`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {mode === 'signup' && (
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as AppRole)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="investor" id="investor" className="peer sr-only" />
                      <Label
                        htmlFor="investor"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                      >
                        <TrendingUp className="mb-2 h-6 w-6" />
                        <span className="font-medium">Investor</span>
                        <span className="text-xs text-muted-foreground">Looking to buy</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="wholesaler" id="wholesaler" className="peer sr-only" />
                      <Label
                        htmlFor="wholesaler"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                      >
                        <Building2 className="mb-2 h-6 w-6" />
                        <span className="font-medium">Wholesaler</span>
                        <span className="text-xs text-muted-foreground">Posting deals</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading
                  ? 'Please wait...'
                  : showAddRolePrompt
                    ? `Sign In & Add ${pendingRole ? ROLE_LABELS[pendingRole] : ''} Role`
                    : mode === 'signup'
                      ? 'Create Account'
                      : 'Sign In'
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setMode('signup');
                        setShowAddRolePrompt(false);
                        setPendingRole(null);
                      }}
                      className="font-medium text-primary hover:underline"
                    >
                      Create one
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
