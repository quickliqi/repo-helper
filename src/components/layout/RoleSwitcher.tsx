import { useAuth } from '@/hooks/useAuth';
import { ArrowLeftRight } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { AppRole } from '@/types/database';

const ROLE_LABELS: Record<AppRole, string> = {
  investor: 'Investor',
  wholesaler: 'Wholesaler',
  admin: 'Admin',
};

export function RoleSwitcher() {
  const { role, allRoles, switchRole } = useAuth();

  // Only show if user has more than one role
  if (!allRoles || allRoles.length <= 1) {
    return null;
  }

  const otherRoles = allRoles.filter(r => r !== role);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer">
        <ArrowLeftRight className="mr-2 h-4 w-4" />
        Switch Role
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {otherRoles.map((r) => (
          <DropdownMenuItem 
            key={r} 
            onClick={() => switchRole(r)}
            className="cursor-pointer"
          >
            Switch to {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
