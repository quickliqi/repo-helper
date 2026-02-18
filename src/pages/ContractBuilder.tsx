import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Loader2, AlertCircle, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const BASE_TEMPLATES = [
    { id: 'assignment', name: 'Standard Assignment Contract', content: 'ASSIGNMENT OF CONTRACT\n\nThis Assignment of Contract (the "Assignment") is made and entered into by and between...' },
    { id: 'purchase_sale', name: 'Purchase & Sale Agreement', content: 'PURCHASE AND SALE AGREEMENT\n\nThis Purchase and Sale Agreement (the "Agreement") is made by and between...' },
    { id: 'option', name: 'Option to Purchase', content: 'OPTION TO PURCHASE REAL ESTATE\n\nThis Option to Purchase Real Estate (the "Option") is granted by...' },
];

const ADD_ONS = [
    { id: 'inspection', name: '7-Day Inspection Period', content: 'INSPECTION PERIOD: Buyer shall have a period of seven (7) days from the Effective Date to inspect the Property...' },
    { id: 'partner_approval', name: 'Subject to Partner Approval', content: 'PARTNER APPROVAL: This Agreement is subject to the approval of Buyer\'s business partner within 48 hours...' },
    { id: 'closing_costs', name: 'Buyer Pays Closing Costs', content: 'CLOSING COSTS: Buyer agrees to pay all closing costs associated with this transaction, including but not limited to...' },
    { id: 'vacant_possession', name: 'Vacant Possession at Closing', content: 'POSSESSION: Seller shall deliver the Property vacant and free of all personal property and debris at Closing...' },
];

export default function ContractBuilder() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [credits, setCredits] = useState<{ free: number; purchased: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                // Cast to any to avoid type errors with new table
                const { data, error } = await supabase
                    .from('user_contract_credits' as any)
                    .select('*')
                    .eq('user_id', user!.id)
                    .single();

                if (error || !data || (data.monthly_free_credits + data.purchased_credits) === 0) {
                    console.log("User has missing or 0 credits, applying fallback upsert...");
                    try {
                        const { data: newData, error: upsertError } = await supabase
                            .from('user_contract_credits' as any)
                            .upsert({
                                user_id: user!.id,
                                monthly_free_credits: 5,
                                purchased_credits: 0,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' })
                            .select()
                            .single();

                        if (!upsertError && newData) {
                            setCredits({ free: newData.monthly_free_credits, purchased: newData.purchased_credits });
                            return;
                        }
                    } catch (err) {
                        console.error("Failed to apply credit fallback:", err);
                    }
                    // If upsert failed, show 0 (safe fallback)
                    setCredits({ free: 0, purchased: 0 });
                } else {
                    setCredits({ free: data.monthly_free_credits, purchased: data.purchased_credits });
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCredits();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Re-fetch helper for after generation
    const refreshCredits = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('user_contract_credits' as any)
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!error) {
                setCredits({ free: data.monthly_free_credits, purchased: data.purchased_credits });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleAddOn = (id: string) => {
        setSelectedAddOns(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) {
            toast.error('Please select a base template');
            return;
        }

        setGenerating(true);

        try {
            const { error } = await supabase.functions.invoke('deduct-contract-credit', {
                method: 'POST',
            });

            if (error) {
                console.error("Function error:", error);
                // Check for payment required based on error content or status if available
                // Note: Supabase JS library behavior on 402 might vary, but we look for indicators
                const errorString = String(error).toLowerCase();
                if (errorString.includes("payment") || errorString.includes("402") || (error as any).status === 402) {
                    toast.error("Insufficient credits. Please upgrade or buy more.", {
                        action: {
                            label: "Get Credits",
                            onClick: () => navigate('/pricing')
                        }
                    });
                    return;
                }
                toast.error('Failed to deduct credit. Please try again.');
                return;
            }

            // Success! Generate the document
            await generateDocument();
            // Refresh credits
            refreshCredits();
            toast.success('Contract generated successfully!');

        } catch (err) {
            console.error('Generation error:', err);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const generateDocument = async () => {
        const template = BASE_TEMPLATES.find(t => t.id === selectedTemplate);
        if (!template) return;

        const children = [];

        // Title
        children.push(new Paragraph({
            text: template.name,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
        }));

        // Base Content - split by double newline for paragraphs
        const paragraphs = template.content.split('\n\n');
        paragraphs.forEach(p => {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: p,
                        size: 24, // 12pt font size
                    }),
                ],
                spacing: { after: 200 }
            }));
        });

        // Add-ons
        if (selectedAddOns.length > 0) {
            children.push(new Paragraph({
                text: "ADDITIONAL TERMS",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            }));

            selectedAddOns.forEach(id => {
                const addOn = ADD_ONS.find(a => a.id === id);
                if (addOn) {
                    children.push(new Paragraph({
                        text: addOn.name.toUpperCase(),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    }));
                    children.push(new Paragraph({
                        children: [
                            new TextRun({
                                text: addOn.content,
                                size: 24,
                            }),
                        ],
                        spacing: { after: 200 }
                    }));
                }
            });
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${template.name.replace(/\s+/g, '_')}_QuickLiqi.docx`);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-foreground">Contract Library</h1>
                        <p className="text-muted-foreground mt-2">Professional real estate contracts, instantly generated.</p>
                    </div>

                    <Card className="bg-primary/5 border-primary/20 min-w-[200px]">
                        <CardContent className="pt-6 pb-4 flex flex-col items-center">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Credits</span>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-primary">
                                    {(credits?.free || 0) + (credits?.purchased || 0)}
                                </span>
                                <span className="text-sm text-muted-foreground">remaining</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {credits?.free || 0} free • {credits?.purchased || 0} paid
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        {/* Step 1: Base Template */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</div>
                                    Select Base Template
                                </CardTitle>
                                <CardDescription>Choose the foundational agreement for your deal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a contract type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BASE_TEMPLATES.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedTemplate && (
                                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground font-mono">
                                        Preview: {BASE_TEMPLATES.find(t => t.id === selectedTemplate)?.content.substring(0, 100)}...
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Step 2: Add-ons */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">2</div>
                                    Select Clauses & Add-ons
                                </CardTitle>
                                <CardDescription>Customize your contract with specific protections.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ADD_ONS.map(addon => (
                                    <div key={addon.id} className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                        <Checkbox
                                            id={addon.id}
                                            checked={selectedAddOns.includes(addon.id)}
                                            onCheckedChange={() => handleToggleAddOn(addon.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor={addon.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {addon.name}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {addon.content.substring(0, 60)}...
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Base Contract:</span>
                                        <span className="font-medium">{selectedTemplate ? 'Selected' : '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Add-ons:</span>
                                        <span className="font-medium">{selectedAddOns.length}</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                        <span className="font-semibold">Total Cost:</span>
                                        <div className="text-right">
                                            <span className="block font-bold text-primary">1 Credit</span>
                                            <span className="text-xs text-muted-foreground">Deducted from balance</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleGenerate}
                                    disabled={generating || !selectedTemplate || ((credits?.free || 0) + (credits?.purchased || 0) <= 0)}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FileCheck className="mr-2 h-4 w-4" />
                                            Generate Document
                                        </>
                                    )}
                                </Button>
                                {((credits?.free || 0) + (credits?.purchased || 0) <= 0) && (
                                    <p className="text-xs text-destructive mt-2 text-center w-full flex items-center justify-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Insufficient credits
                                    </p>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
