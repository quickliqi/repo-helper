import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FeatureFlag {
    id: string;
    key: string;
    is_enabled: boolean;
    description: string;
}

export function FeatureFlagManager() {
    const queryClient = useQueryClient();

    const { data: flags, isLoading } = useQuery({
        queryKey: ["feature_flags"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("feature_flags")
                .select("*")
                .order("key");
            if (error) throw error;
            return data as FeatureFlag[];
        },
    });

    const toggleFlagMutation = useMutation({
        mutationFn: async ({ key, is_enabled }: { key: string; is_enabled: boolean }) => {
            const { data, error } = await supabase.functions.invoke("admin-action", {
                body: {
                    action: "toggle_feature_flag",
                    payload: { key, is_enabled },
                },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            toast.success(`${variables.key} is now ${variables.is_enabled ? 'enabled' : 'disabled'}`);
            queryClient.invalidateQueries({ queryKey: ["feature_flags"] });
        },
        onError: (error) => {
            toast.error(`Failed: ${error.message}`);
        },
    });

    const handleToggle = (key: string, currentValue: boolean) => {
        toggleFlagMutation.mutate({ key, is_enabled: !currentValue });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                    Enable or disable system features in real-time. Use with caution.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6">
                    {flags?.map((flag) => (
                        <div key={flag.id} className="flex items-center justify-between space-x-4 border p-4 rounded-lg">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor={flag.key} className="text-base font-medium">
                                    {flag.key}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {flag.description}
                                </p>
                            </div>
                            <Switch
                                id={flag.key}
                                checked={flag.is_enabled}
                                onCheckedChange={() => handleToggle(flag.key, flag.is_enabled)}
                                disabled={toggleFlagMutation.isPending}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
