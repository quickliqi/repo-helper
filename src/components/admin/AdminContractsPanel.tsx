import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, X, Edit2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserCreditData {
    user_id: string;
    email: string;
    monthly_free_credits: number;
    purchased_credits: number;
}

export function AdminContractsPanel() {
    const [users, setUsers] = useState<UserCreditData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{
        monthly_free_credits: number;
        purchased_credits: number;
    }>({ monthly_free_credits: 0, purchased_credits: 0 });
    const { toast } = useToast();

    const fetchCredits = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-manage-credits', {
                body: { action: 'fetch' }
            });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: unknown) {
            console.error('Error fetching credits:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch credit data";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    const handleEdit = (user: UserCreditData) => {
        setEditingId(user.user_id);
        setEditValues({
            monthly_free_credits: user.monthly_free_credits,
            purchased_credits: user.purchased_credits
        });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const handleSave = async (userId: string) => {
        try {
            const { error } = await supabase.functions.invoke('admin-manage-credits', {
                body: {
                    action: 'update',
                    target_user_id: userId,
                    monthly_free_credits: editValues.monthly_free_credits,
                    purchased_credits: editValues.purchased_credits
                }
            });

            if (error) throw error;

            toast({
                title: "Success",
                description: "User credits updated successfully",
            });

            setEditingId(null);
            fetchCredits();
        } catch (error: unknown) {
            console.error('Error updating credits:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update credits";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Contract Credits</h2>
                <Button variant="outline" size="sm" onClick={fetchCredits} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User Email</TableHead>
                            <TableHead>Monthly Free Credits</TableHead>
                            <TableHead>Purchased Credits</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.user_id}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {editingId === user.user_id ? (
                                            <Input
                                                type="number"
                                                value={editValues.monthly_free_credits}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues({ ...editValues, monthly_free_credits: parseInt(e.target.value) || 0 })}
                                                className="w-24"
                                            />
                                        ) : (
                                            user.monthly_free_credits
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === user.user_id ? (
                                            <Input
                                                type="number"
                                                value={editValues.purchased_credits}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValues({ ...editValues, purchased_credits: parseInt(e.target.value) || 0 })}
                                                className="w-24"
                                            />
                                        ) : (
                                            user.purchased_credits
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === user.user_id ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={handleCancel}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" onClick={() => handleSave(user.user_id)}>
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
