import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, CONDITION_LABELS, PropertyType, DealType, PropertyCondition, US_STATES } from '@/types/database';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown,
  Bell,
  Save
} from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'equity_high';

export interface FilterState {
  searchQuery: string;
  propertyTypes: PropertyType[];
  dealTypes: DealType[];
  conditions: PropertyCondition[];
  states: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minEquity: number | null;
  maxDaysOnMarket: number | null;
  sortBy: SortOption;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSaveSearch?: () => void;
  resultCount?: number;
}

export function AdvancedFilters({ filters, onFiltersChange, onSaveSearch, resultCount }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilterCount = [
    filters.propertyTypes.length > 0,
    filters.dealTypes.length > 0,
    filters.conditions.length > 0,
    filters.states.length > 0,
    filters.minPrice !== null,
    filters.maxPrice !== null,
    filters.minEquity !== null,
    filters.maxDaysOnMarket !== null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      propertyTypes: [],
      dealTypes: [],
      conditions: [],
      states: [],
      minPrice: null,
      maxPrice: null,
      minEquity: null,
      maxDaysOnMarket: null,
    });
  };

  const toggleArrayFilter = <T extends string>(
    array: T[],
    value: T,
    key: keyof FilterState
  ) => {
    const newArray = array.includes(value)
      ? array.filter(v => v !== value)
      : [...array, value];
    onFiltersChange({ ...filters, [key]: newArray });
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Quick Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address, city, or title..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-10 h-11"
          />
        </div>

        {/* Sort Dropdown */}
        <Select 
          value={filters.sortBy} 
          onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as SortOption })}
        >
          <SelectTrigger className="w-full sm:w-44 h-11">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="equity_high">Highest Equity</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 justify-center rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Advanced Filters
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </SheetTitle>
              <SheetDescription>
                {resultCount !== undefined && `${resultCount} properties match your criteria`}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 pt-6">
              {/* Property Types */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Property Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`type-${value}`}
                        checked={filters.propertyTypes.includes(value as PropertyType)}
                        onCheckedChange={() => toggleArrayFilter(filters.propertyTypes, value as PropertyType, 'propertyTypes')}
                      />
                      <label htmlFor={`type-${value}`} className="text-sm cursor-pointer">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deal Types */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Deal Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`deal-${value}`}
                        checked={filters.dealTypes.includes(value as DealType)}
                        onCheckedChange={() => toggleArrayFilter(filters.dealTypes, value as DealType, 'dealTypes')}
                      />
                      <label htmlFor={`deal-${value}`} className="text-sm cursor-pointer">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Condition</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                    <Badge
                      key={value}
                      variant={filters.conditions.includes(value as PropertyCondition) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter(filters.conditions, value as PropertyCondition, 'conditions')}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* States */}
              <div className="space-y-3">
                <Label className="text-base font-medium">States</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!filters.states.includes(value)) {
                      onFiltersChange({ ...filters, states: [...filters.states, value] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.filter(s => !filters.states.includes(s)).map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filters.states.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {filters.states.map((state) => (
                      <Badge key={state} variant="secondary" className="gap-1">
                        {state}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => onFiltersChange({ 
                            ...filters, 
                            states: filters.states.filter(s => s !== state) 
                          })}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Price Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Min Price</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={filters.minPrice || ''}
                      onChange={(e) => onFiltersChange({ 
                        ...filters, 
                        minPrice: e.target.value ? parseInt(e.target.value) : null 
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Max Price</Label>
                    <Input
                      type="number"
                      placeholder="No max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => onFiltersChange({ 
                        ...filters, 
                        maxPrice: e.target.value ? parseInt(e.target.value) : null 
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Min Equity */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-base font-medium">Minimum Equity</Label>
                  <span className="text-sm text-muted-foreground">
                    {filters.minEquity ? `${filters.minEquity}%+` : 'Any'}
                  </span>
                </div>
                <Slider
                  value={[filters.minEquity || 0]}
                  onValueChange={([value]) => onFiltersChange({ 
                    ...filters, 
                    minEquity: value > 0 ? value : null 
                  })}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Days on Market */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-base font-medium">Days on Market</Label>
                  <span className="text-sm text-muted-foreground">
                    {filters.maxDaysOnMarket ? `≤ ${filters.maxDaysOnMarket} days` : 'Any'}
                  </span>
                </div>
                <Select
                  value={filters.maxDaysOnMarket?.toString() || ''}
                  onValueChange={(value) => onFiltersChange({
                    ...filters,
                    maxDaysOnMarket: value ? parseInt(value) : null,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {onSaveSearch && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => {
                      onSaveSearch();
                      setIsOpen(false);
                    }}
                  >
                    <Bell className="h-4 w-4" />
                    Save Search & Get Alerts
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Clear filters button */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="h-11 gap-2">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.propertyTypes.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {PROPERTY_TYPE_LABELS[type]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter(filters.propertyTypes, type, 'propertyTypes')}
              />
            </Badge>
          ))}
          {filters.dealTypes.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {DEAL_TYPE_LABELS[type]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter(filters.dealTypes, type, 'dealTypes')}
              />
            </Badge>
          ))}
          {filters.states.map(state => (
            <Badge key={state} variant="secondary" className="gap-1">
              {state}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, states: filters.states.filter(s => s !== state) })}
              />
            </Badge>
          ))}
          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              {filters.minPrice ? formatPrice(filters.minPrice) : '$0'} - {filters.maxPrice ? formatPrice(filters.maxPrice) : 'No max'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, minPrice: null, maxPrice: null })}
              />
            </Badge>
          )}
          {filters.minEquity && (
            <Badge variant="secondary" className="gap-1">
              {filters.minEquity}%+ Equity
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, minEquity: null })}
              />
            </Badge>
          )}
          {filters.maxDaysOnMarket && (
            <Badge variant="secondary" className="gap-1">
              ≤ {filters.maxDaysOnMarket} days
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, maxDaysOnMarket: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}