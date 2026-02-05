import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JVSignDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    property: {
        id: string;
        address: string;
        wholesaler_id: string;
        wholesaler_name?: string;
    };
    investorName: string;
}

export function JVSignDialog({ isOpen, onClose, onSuccess, property, investorName }: JVSignDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const handleSign = async () => {
        setIsSigning(true);
        try {
            // 1. Mark as signed in DB
            const { error: dbError } = await (supabase as any)
                .from('jv_agreements')
                .insert({
                    investor_id: (await supabase.auth.getUser()).data.user?.id,
                    wholesaler_id: property.wholesaler_id,
                    property_id: property.id,
                });

            if (dbError) throw dbError;

            toast.success('JV Agreement signed! Messaging is now unlocked.');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error signing JV:', error);
            toast.error('Failed to sign agreement: ' + error.message);
        } finally {
            setIsSigning(false);
        }
    };

    const handlePreview = async () => {
        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-jv-agreement', {
                body: {
                    propertyId: property.id,
                    investorName,
                    wholesalerName: property.wholesaler_name || 'Wholesaler',
                    propertyAddress: property.address,
                },
            });

            if (error) throw error;

            // Create blob and open in new tab
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF preview');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl">Sign JV Agreement</DialogTitle>
                    <DialogDescription className="text-center">
                        To view contact details and message the wholesaler for <strong>{property.address}</strong>,
                        you must agree to the platform's Joint Venture terms.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-muted p-4 rounded-lg border text-sm space-y-2">
                        <p className="font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            90/10 Fee Split Agreement
                        </p>
                        <p className="text-muted-foreground">
                            By signing, you agree that any assignment fee from this deal will be split 90% to the wholesaler and 10% to QuickLiqi.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        onClick={handlePreview}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Preview JV Agreement (PDF)
                    </Button>
                </div>

                <DialogFooter className="sm:justify-center flex-col gap-2">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSign}
                        disabled={isSigning}
                    >
                        {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "I Agree & Sign"}
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
