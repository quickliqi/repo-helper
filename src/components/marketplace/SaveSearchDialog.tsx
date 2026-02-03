import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FilterState } from './AdvancedFilters';

interface SaveSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
}

export function SaveSearchDialog({ isOpen, onClose, filters }: SaveSearchDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save searches');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        name: name.trim(),
        search_query: filters.searchQuery || null,
        property_types: filters.propertyTypes,
        deal_types: filters.dealTypes,
        states: filters.states,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        notifications_enabled: notifications,
      });

      if (error) throw error;

      toast.success('Search saved! You\'ll be notified of new matches.');
      onClose();
      setName('');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Save This Search
          </DialogTitle>
          <DialogDescription>
            Get notified when new properties match your current filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              placeholder="e.g., Miami Fix & Flips under $200K"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts when new properties match
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          {/* Filter summary */}
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <p className="font-medium">Current Filters:</p>
            <ul className="text-muted-foreground space-y-0.5">
              {filters.searchQuery && <li>Search: "{filters.searchQuery}"</li>}
              {filters.propertyTypes.length > 0 && <li>Types: {filters.propertyTypes.length} selected</li>}
              {filters.dealTypes.length > 0 && <li>Deals: {filters.dealTypes.length} selected</li>}
              {filters.states.length > 0 && <li>States: {filters.states.join(', ')}</li>}
              {(filters.minPrice || filters.maxPrice) && (
                <li>Price: ${filters.minPrice?.toLocaleString() || '0'} - ${filters.maxPrice?.toLocaleString() || 'Any'}</li>
              )}
              {filters.minEquity && <li>Min Equity: {filters.minEquity}%</li>}
              {!filters.searchQuery && filters.propertyTypes.length === 0 && filters.dealTypes.length === 0 && 
               filters.states.length === 0 && !filters.minPrice && !filters.maxPrice && !filters.minEquity && (
                <li>All properties (no filters)</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Search'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}