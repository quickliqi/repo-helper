import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  BuyBox as BuyBoxType, 
  PropertyType, 
  DealType, 
  PropertyCondition,
  PROPERTY_TYPE_LABELS,
  DEAL_TYPE_LABELS,
  CONDITION_LABELS,
  US_STATES
} from '@/types/database';
import { 
  Plus, 
  Save, 
  Trash2, 
  Target,
  MapPin,
  DollarSign,
  Home,
  Loader2,
  X
} from 'lucide-react';

const PROPERTY_TYPES: PropertyType[] = ['single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land', 'mobile_home', 'other'];
const DEAL_TYPES: DealType[] = ['fix_and_flip', 'buy_and_hold', 'wholesale', 'subject_to', 'seller_finance', 'other'];
const CONDITIONS: PropertyCondition[] = ['excellent', 'good', 'fair', 'poor', 'distressed'];

interface BuyBoxFormData {
  name: string;
  property_types: PropertyType[];
  deal_types: DealType[];
  min_price: string;
  max_price: string;
  min_arv: string;
  max_arv: string;
  min_equity_percentage: string;
  preferred_conditions: PropertyCondition[];
  target_cities: string[];
  target_states: string[];
  target_zip_codes: string[];
  max_radius_miles: string;
  notes: string;
  is_active: boolean;
}

const emptyFormData: BuyBoxFormData = {
  name: 'My Buy Box',
  property_types: [],
  deal_types: [],
  min_price: '',
  max_price: '',
  min_arv: '',
  max_arv: '',
  min_equity_percentage: '',
  preferred_conditions: [],
  target_cities: [],
  target_states: [],
  target_zip_codes: [],
  max_radius_miles: '',
  notes: '',
  is_active: true,
};

export default function BuyBox() {
  const { user } = useAuth();
  const [buyBoxes, setBuyBoxes] = useState<BuyBoxType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBuyBox, setSelectedBuyBox] = useState<string | null>(null);
  const [formData, setFormData] = useState<BuyBoxFormData>(emptyFormData);
  const [cityInput, setCityInput] = useState('');
  const [zipInput, setZipInput] = useState('');

  useEffect(() => {
    if (user) {
      fetchBuyBoxes();
    }
  }, [user]);

  const fetchBuyBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('buy_boxes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyBoxes((data as BuyBoxType[]) || []);
      
      if (data && data.length > 0) {
        selectBuyBox(data[0] as BuyBoxType);
      }
    } catch (error) {
      console.error('Error fetching buy boxes:', error);
      toast.error('Failed to load buy boxes');
    } finally {
      setIsLoading(false);
    }
  };

  const selectBuyBox = (buyBox: BuyBoxType) => {
    setSelectedBuyBox(buyBox.id);
    setFormData({
      name: buyBox.name,
      property_types: buyBox.property_types,
      deal_types: buyBox.deal_types,
      min_price: buyBox.min_price?.toString() || '',
      max_price: buyBox.max_price?.toString() || '',
      min_arv: buyBox.min_arv?.toString() || '',
      max_arv: buyBox.max_arv?.toString() || '',
      min_equity_percentage: buyBox.min_equity_percentage?.toString() || '',
      preferred_conditions: buyBox.preferred_conditions || [],
      target_cities: buyBox.target_cities || [],
      target_states: buyBox.target_states || [],
      target_zip_codes: buyBox.target_zip_codes || [],
      max_radius_miles: buyBox.max_radius_miles?.toString() || '',
      notes: buyBox.notes || '',
      is_active: buyBox.is_active,
    });
  };

  const createNewBuyBox = () => {
    setSelectedBuyBox(null);
    setFormData(emptyFormData);
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (formData.property_types.length === 0) {
      toast.error('Please select at least one property type');
      return;
    }
    if (formData.deal_types.length === 0) {
      toast.error('Please select at least one deal type');
      return;
    }

    setIsSaving(true);
    try {
      const buyBoxData = {
        user_id: user.id,
        name: formData.name || 'My Buy Box',
        property_types: formData.property_types,
        deal_types: formData.deal_types,
        min_price: formData.min_price ? parseInt(formData.min_price) : null,
        max_price: formData.max_price ? parseInt(formData.max_price) : null,
        min_arv: formData.min_arv ? parseInt(formData.min_arv) : null,
        max_arv: formData.max_arv ? parseInt(formData.max_arv) : null,
        min_equity_percentage: formData.min_equity_percentage ? parseInt(formData.min_equity_percentage) : null,
        preferred_conditions: formData.preferred_conditions,
        target_cities: formData.target_cities,
        target_states: formData.target_states,
        target_zip_codes: formData.target_zip_codes,
        max_radius_miles: formData.max_radius_miles ? parseInt(formData.max_radius_miles) : null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      if (selectedBuyBox) {
        const { error } = await supabase
          .from('buy_boxes')
          .update(buyBoxData)
          .eq('id', selectedBuyBox);
        if (error) throw error;
        toast.success('Buy box updated successfully');
      } else {
        const { error } = await supabase
          .from('buy_boxes')
          .insert(buyBoxData);
        if (error) throw error;
        toast.success('Buy box created successfully');
      }

      fetchBuyBoxes();
    } catch (error) {
      console.error('Error saving buy box:', error);
      toast.error('Failed to save buy box');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBuyBox) return;
    
    if (!confirm('Are you sure you want to delete this buy box?')) return;

    try {
      const { error } = await supabase
        .from('buy_boxes')
        .delete()
        .eq('id', selectedBuyBox);
      if (error) throw error;
      toast.success('Buy box deleted');
      setSelectedBuyBox(null);
      setFormData(emptyFormData);
      fetchBuyBoxes();
    } catch (error) {
      console.error('Error deleting buy box:', error);
      toast.error('Failed to delete buy box');
    }
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const addCity = () => {
    if (cityInput.trim() && !formData.target_cities.includes(cityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        target_cities: [...prev.target_cities, cityInput.trim()]
      }));
      setCityInput('');
    }
  };

  const addZip = () => {
    if (zipInput.trim() && !formData.target_zip_codes.includes(zipInput.trim())) {
      setFormData(prev => ({
        ...prev,
        target_zip_codes: [...prev.target_zip_codes, zipInput.trim()]
      }));
      setZipInput('');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  My Buy Box
                </h1>
                <p className="text-muted-foreground">
                  Define your investment criteria to receive matched deals automatically
                </p>
              </div>
              <Button onClick={createNewBuyBox} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Buy Box
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Buy Box List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Buy Boxes</CardTitle>
                  <CardDescription>Select to edit or create new</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {buyBoxes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No buy boxes yet. Create your first one!
                    </p>
                  ) : (
                    buyBoxes.map(bb => (
                      <button
                        key={bb.id}
                        onClick={() => selectBuyBox(bb)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedBuyBox === bb.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{bb.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={bb.is_active ? "default" : "secondary"} className="text-xs">
                            {bb.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {bb.property_types.length} types
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Buy Box Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {selectedBuyBox ? 'Edit Buy Box' : 'Create Buy Box'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Buy Box Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Florida Fix & Flips"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, is_active: checked === true }))
                        }
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">
                        Active (receive matches)
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Types
                  </CardTitle>
                  <CardDescription>Select all property types you're interested in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PROPERTY_TYPES.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`prop-${type}`}
                          checked={formData.property_types.includes(type)}
                          onCheckedChange={() => 
                            setFormData(prev => ({
                              ...prev,
                              property_types: toggleArrayItem(prev.property_types, type)
                            }))
                          }
                        />
                        <Label htmlFor={`prop-${type}`} className="cursor-pointer text-sm">
                          {PROPERTY_TYPE_LABELS[type]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deal Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Deal Types</CardTitle>
                  <CardDescription>What types of deals are you looking for?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {DEAL_TYPES.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`deal-${type}`}
                          checked={formData.deal_types.includes(type)}
                          onCheckedChange={() => 
                            setFormData(prev => ({
                              ...prev,
                              deal_types: toggleArrayItem(prev.deal_types, type)
                            }))
                          }
                        />
                        <Label htmlFor={`deal-${type}`} className="cursor-pointer text-sm">
                          {DEAL_TYPE_LABELS[type]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Price Range */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Price & Value Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Min Purchase Price ($)</Label>
                      <Input
                        type="number"
                        value={formData.min_price}
                        onChange={e => setFormData(prev => ({ ...prev, min_price: e.target.value }))}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Purchase Price ($)</Label>
                      <Input
                        type="number"
                        value={formData.max_price}
                        onChange={e => setFormData(prev => ({ ...prev, max_price: e.target.value }))}
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Equity %</Label>
                      <Input
                        type="number"
                        value={formData.min_equity_percentage}
                        onChange={e => setFormData(prev => ({ ...prev, min_equity_percentage: e.target.value }))}
                        placeholder="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min ARV ($)</Label>
                      <Input
                        type="number"
                        value={formData.min_arv}
                        onChange={e => setFormData(prev => ({ ...prev, min_arv: e.target.value }))}
                        placeholder="100000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max ARV ($)</Label>
                      <Input
                        type="number"
                        value={formData.max_arv}
                        onChange={e => setFormData(prev => ({ ...prev, max_arv: e.target.value }))}
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Target Locations
                  </CardTitle>
                  <CardDescription>Leave empty to match all locations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* States */}
                  <div className="space-y-2">
                    <Label>Target States</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.target_states.map(state => (
                        <Badge key={state} variant="secondary" className="gap-1">
                          {state}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              target_states: prev.target_states.filter(s => s !== state)
                            }))}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
                      {US_STATES.filter(s => !formData.target_states.includes(s)).map(state => (
                        <Button
                          key={state}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            target_states: [...prev.target_states, state]
                          }))}
                        >
                          {state}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="space-y-2">
                    <Label>Target Cities</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.target_cities.map(city => (
                        <Badge key={city} variant="secondary" className="gap-1">
                          {city}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              target_cities: prev.target_cities.filter(c => c !== city)
                            }))}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={cityInput}
                        onChange={e => setCityInput(e.target.value)}
                        placeholder="Enter city name"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCity())}
                      />
                      <Button type="button" variant="outline" onClick={addCity}>Add</Button>
                    </div>
                  </div>

                  {/* Zip Codes */}
                  <div className="space-y-2">
                    <Label>Target Zip Codes</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.target_zip_codes.map(zip => (
                        <Badge key={zip} variant="secondary" className="gap-1">
                          {zip}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              target_zip_codes: prev.target_zip_codes.filter(z => z !== zip)
                            }))}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={zipInput}
                        onChange={e => setZipInput(e.target.value)}
                        placeholder="Enter zip code"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZip())}
                      />
                      <Button type="button" variant="outline" onClick={addZip}>Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Condition */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Conditions</CardTitle>
                  <CardDescription>What property conditions are acceptable?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {CONDITIONS.map(condition => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cond-${condition}`}
                          checked={formData.preferred_conditions.includes(condition)}
                          onCheckedChange={() => 
                            setFormData(prev => ({
                              ...prev,
                              preferred_conditions: toggleArrayItem(prev.preferred_conditions, condition)
                            }))
                          }
                        />
                        <Label htmlFor={`cond-${condition}`} className="cursor-pointer">
                          {CONDITION_LABELS[condition]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Any additional criteria or preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g., Prefer properties with motivated sellers, no HOA, etc."
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1 md:flex-none">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {selectedBuyBox ? 'Update Buy Box' : 'Create Buy Box'}
                </Button>
                {selectedBuyBox && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
