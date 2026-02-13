import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, MoreHorizontal, Search, UserCog, Ban, Eye } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
    id: string;
    email: string | null; // Joined from auth.users ideally, but simple profiles might not have it if not synced
    full_name: string | null;
    role: string;
    is_verified: boolean;
    created_at: string;
}

export function UserManagement() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin_users"],
        queryFn: async () => {
            // Fetch profiles with roles
            // Note: Joining with auth.users is hard from client unless we have a view or Edge Function
            // For now, we rely on public.profiles and public.user_roles
            const { data: profiles, error } = await supabase
                .from("profiles")
                .select(`
          *,
          user_roles (role)
        `)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;

            return profiles.map((p: any) => ({
                id: p.id,
                email: p.email, // If we synced email to profiles
                full_name: p.full_name,
                role: p.user_roles?.[0]?.role || 'user',
                is_verified: p.is_verified,
                created_at: p.created_at,
            })) as UserProfile[];
        },
    });

    const validRoles = ['user', 'investor', 'wholesaler', 'admin', 'analyst'];

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
            // Upsert user_roles
            const { error } = await supabase
                .from('user_roles')
                .upsert({ user_id: userId, role: newRole } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("User role updated");
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
        },
        onError: (err) => toast.error(err.message)
    });

    const handleImpersonate = (userId: string) => {
        // Placeholder for now
        toast.info(`Impersonation mode for ${userId} coming soon`);
        // Logic would be: set a global "impersonatedUserId" state, 
        // and have the app use that ID for queries instead of auth.uid()
    };

    const filteredUsers = users?.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.includes(searchTerm)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredUsers?.length || 0} users
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.full_name || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.is_verified ? (
                                            <span className="text-green-600 text-xs font-bold">YES</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">NO</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View As
                                                </DropdownMenuItem>
                                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                {validRoles.map(role => (
                                                    <DropdownMenuItem
                                                        key={role}
                                                        onClick={() => updateRoleMutation.mutate({ userId: user.id, newRole: role })}
                                                        disabled={user.role === role}
                                                    >
                                                        <UserCog className="mr-2 h-4 w-4" /> Make {role}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
