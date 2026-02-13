import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface LeadMagnetProps {
    title?: string;
    description?: string;
    buttonText?: string;
    assetUrl?: string; // In a real app, this would be the file URL or trigger an API call
    className?: string;
}

export function LeadMagnet({
    title = "Download the Deal Analysis Calculator",
    description = "Get the exact spreadsheet used to underwrite over $50M in wholesale transactions. Includes MAO formulas and repair estimators.",
    buttonText = "Unlock Asset",
    assetUrl = "#",
    className
}: LeadMagnetProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [unlocked, setUnlocked] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setUnlocked(true);
            toast.success("Resource unlocked! Check your email for the download link.");
            // In a real app, we would redirect or trigger the download here
        }, 1500);
    };

    if (unlocked) {
        return (
            <Card className={`bg-success/5 border-success/20 ${className}`}>
                <CardContent className="py-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Resource Unlocked</h3>
                    <p className="text-muted-foreground mb-6">
                        The asset has been sent to <strong>{email}</strong>.
                    </p>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Now
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Institutional Utility
                    </span>
                </div>
                <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
                <CardDescription className="text-base mt-2">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <Input
                        type="email"
                        placeholder="business@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading} className="min-w-[140px]">
                        {loading ? "Unlocking..." : buttonText}
                    </Button>
                </form>
                <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Secure access. We only send high-signal liquidity alerts.
                </p>
            </CardContent>
        </Card>
    );
}
