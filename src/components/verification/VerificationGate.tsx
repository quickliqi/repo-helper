import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface VerificationGateProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

export function VerificationGate({ children, feature = 'this feature', fallback }: VerificationGateProps) {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Allow if verified
  if (profile?.verification_status === 'approved' || profile?.is_verified) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default blocked state
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <CardTitle>Verification Required</CardTitle>
        <CardDescription>
          Complete identity verification to access {feature}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild>
          <Link to="/verify">
            <Shield className="h-4 w-4 mr-2" />
            Get Verified
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface VerificationRequiredButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function VerificationRequiredButton({ 
  children, 
  onClick, 
  className,
  variant = 'default',
  size = 'default'
}: VerificationRequiredButtonProps) {
  const { profile } = useAuth();

  const isVerified = profile?.verification_status === 'approved' || profile?.is_verified;

  if (isVerified) {
    return (
      <Button onClick={onClick} className={className} variant={variant} size={size}>
        {children}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link to="/verify" className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        Verify to Continue
      </Link>
    </Button>
  );
}
