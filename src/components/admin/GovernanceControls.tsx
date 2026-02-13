import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface PlatformSetting {
    id: string;
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'json';
    description: string;
}

export function GovernanceControls() {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
    const [isChanged, setIsChanged] = useState<Record<string, boolean>>({});

    const { data: settings, isLoading } = useQuery({
        queryKey: ["platform_settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("platform_settings")
                .select("*")
                .order("key");
            if (error) throw error;
            return data as PlatformSetting[];
        },
    });

    // Initialize local state when data loads
    useEffect(() => {
        if (settings) {
            const initial: Record<string, any> = {};
            settings.forEach(s => {
                initial[s.key] = s.value;
            });
            setLocalSettings(initial);
        }
    }, [settings]);

    const updateSettingMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: any }) => {
            const { data, error } = await supabase.functions.invoke("admin-action", {
                body: {
                    action: "update_platform_setting",
                    payload: { key, value },
                },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            toast.success(`Updated ${variables.key}`);
            queryClient.invalidateQueries({ queryKey: ["platform_settings"] });
            setIsChanged(prev => ({ ...prev, [variables.key]: false }));
        },
        onError: (error) => {
            toast.error(`Failed: ${error.message}`);
        },
    });

    const handleCreateDefaults = async () => {
        // Helper for development: verify defaults exist
        // In a real app, this might be a migration
        toast.info("Checking defaults...");
    };

    const handleInputChange = (key: string, value: any, type: string) => {
        let parsedValue = value;
        if (type === 'number') parsedValue = parseFloat(value);

        setLocalSettings(prev => ({ ...prev, [key]: parsedValue }));
        setIsChanged(prev => ({ ...prev, [key]: true }));
    };

    const handleSave = (key: string) => {
        updateSettingMutation.mutate({ key, value: localSettings[key] });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Marketplace Governance</CardTitle>
                <CardDescription>
                    Adjust global parameters for Deal Analysis, ARV calculations, and Risk thresholds.
                    Changes take effect immediately for new calculations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {settings?.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                        No settings found.
                        <Button variant="outline" onClick={handleCreateDefaults} className="ml-2">Initialize Defaults</Button>
                    </div>
                )}

                <div className="grid gap-6">
                    {settings?.map((setting) => (
                        <div key={setting.id} className="grid w-full items-center gap-1.5 border-b pb-4 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                                <Label htmlFor={setting.key} className="text-base font-semibold">
                                    {setting.key.replace(/_/g, ' ').toUpperCase()}
                                </Label>
                                {isChanged[setting.key] && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleSave(setting.key)}
                                        disabled={updateSettingMutation.isPending}
                                    >
                                        {updateSettingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                        Save
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>

                            {setting.type === 'boolean' ? (
                                <div className="flex items-center space-x-2">
                                    {/* Simplified boolean toggle for now - could use Switch component */}
                                    <Button
                                        variant={localSettings[setting.key] ? "default" : "outline"}
                                        onClick={() => handleInputChange(setting.key, !localSettings[setting.key], 'boolean')}
                                    >
                                        {localSettings[setting.key] ? "Enabled" : "Disabled"}
                                    </Button>
                                </div>
                            ) : (
                                <Input
                                    id={setting.key}
                                    type={setting.type === 'number' ? 'number' : 'text'}
                                    value={localSettings[setting.key] ?? ''}
                                    step={setting.type === 'number' ? '0.01' : undefined}
                                    onChange={(e) => handleInputChange(setting.key, e.target.value, setting.type)}
                                    className="max-w-md"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
