import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { UpgradePrompt } from '@/components/subscription/SubscriptionGate';
import { 
  PropertyType, 
  DealType, 
  PropertyCondition,
  PROPERTY_TYPE_LABELS,
  DEAL_TYPE_LABELS,
  CONDITION_LABELS,
  US_STATES
} from '@/types/database';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Home,
  Camera,
  X,
  Loader2,
  Plus,
  Sparkles
} from 'lucide-react';

const PROPERTY_TYPES: PropertyType[] = ['single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land', 'mobile_home', 'other'];
const DEAL_TYPES: DealType[] = ['fix_and_flip', 'buy_and_hold', 'wholesale', 'subject_to', 'seller_finance', 'other'];
const CONDITIONS: PropertyCondition[] = ['excellent', 'good', 'fair', 'poor', 'distressed'];

interface FormData {
  title: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: PropertyType | '';
  deal_type: DealType | '';
  condition: PropertyCondition | '';
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  lot_size_sqft: string;
  year_built: string;
  asking_price: string;
  arv: string;
  repair_estimate: string;
  assignment_fee: string;
  equity_percentage: string;
  description: string;
  highlights: string[];
}

const emptyFormData: FormData = {
  title: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  property_type: '',
  deal_type: '',
  condition: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  lot_size_sqft: '',
  year_built: '',
  asking_price: '',
  arv: '',
  repair_estimate: '',
  assignment_fee: '',
  equity_percentage: '',
  description: '',
  highlights: [],
};

export default function PostDeal() {
  const { user } = useAuth();
  const { listingCredits, isLoading: subscriptionLoading, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addHighlight = () => {
    if (highlightInput.trim() && formData.highlights.length < 10) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()]
      }));
      setHighlightInput('');
    }
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      urls.push(publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to post a deal');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Please enter an address');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('Please enter a city');
      return;
    }
    if (!formData.state) {
      toast.error('Please select a state');
      return;
    }
    if (!formData.zip_code.trim()) {
      toast.error('Please enter a zip code');
      return;
    }
    if (!formData.property_type) {
      toast.error('Please select a property type');
      return;
    }
    if (!formData.deal_type) {
      toast.error('Please select a deal type');
      return;
    }
    if (!formData.condition) {
      toast.error('Please select a condition');
      return;
    }
    if (!formData.asking_price) {
      toast.error('Please enter an asking price');
      return;
    }

    setIsSubmitting(true);
    try {
      // First, deduct a listing credit
      const { data: creditData, error: creditError } = await supabase.functions.invoke('use-listing-credit');
      
      if (creditError || !creditData?.success) {
        const errorMsg = creditData?.error || creditError?.message || 'Failed to use listing credit';
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      // Create the property
      const { error } = await supabase.from('properties').insert({
        user_id: user.id,
        title: formData.title.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
        zip_code: formData.zip_code.trim(),
        property_type: formData.property_type as PropertyType,
        deal_type: formData.deal_type as DealType,
        condition: formData.condition as PropertyCondition,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        sqft: formData.sqft ? parseInt(formData.sqft) : null,
        lot_size_sqft: formData.lot_size_sqft ? parseInt(formData.lot_size_sqft) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        asking_price: parseInt(formData.asking_price),
        arv: formData.arv ? parseInt(formData.arv) : null,
        repair_estimate: formData.repair_estimate ? parseInt(formData.repair_estimate) : null,
        assignment_fee: formData.assignment_fee ? parseInt(formData.assignment_fee) : null,
        equity_percentage: formData.equity_percentage ? parseInt(formData.equity_percentage) : null,
        description: formData.description.trim() || null,
        highlights: formData.highlights.length > 0 ? formData.highlights : null,
        image_urls: imageUrls,
        status: 'active',
      });

      if (error) throw error;

      // Refresh subscription to get updated credit count
      await refreshSubscription();

      toast.success('Deal posted successfully! Matching investors will be notified.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error posting deal:', error);
      toast.error('Failed to post deal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gate posting for wholesalers without credits
  if (!subscriptionLoading && listingCredits <= 0) {
    return (
      <MainLayout>
        <div className="bg-background min-h-screen">
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Post a New Deal
              </h1>
              <p className="text-muted-foreground">
                List your property and get matched with interested investors automatically
              </p>
            </div>
          </div>
          <div className="container mx-auto px-4 py-12">
            <UpgradePrompt type="wholesaler" />
          </div>
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
                  Post a New Deal
                </h1>
                <p className="text-muted-foreground">
                  List your property and get matched with interested investors automatically
                </p>
              </div>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                {listingCredits} credit{listingCredits !== 1 ? 's' : ''} remaining
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Listing Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Great Fix & Flip Opportunity in Downtown"
                    maxLength={100}
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type *</Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value as PropertyType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {PROPERTY_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deal Type *</Label>
                    <Select
                      value={formData.deal_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, deal_type: value as DealType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select deal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEAL_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {DEAL_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value as PropertyCondition }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(condition => (
                          <SelectItem key={condition} value={condition}>
                            {CONDITION_LABELS[condition]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Miami"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Zip Code *</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={e => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                      placeholder="33101"
                      maxLength={10}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={e => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                      placeholder="3"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={e => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                      placeholder="2"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Sq Ft</Label>
                    <Input
                      id="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={e => setFormData(prev => ({ ...prev, sqft: e.target.value }))}
                      placeholder="1500"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lot_size_sqft">Lot Size (Sq Ft)</Label>
                    <Input
                      id="lot_size_sqft"
                      type="number"
                      value={formData.lot_size_sqft}
                      onChange={e => setFormData(prev => ({ ...prev, lot_size_sqft: e.target.value }))}
                      placeholder="5000"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_built">Year Built</Label>
                    <Input
                      id="year_built"
                      type="number"
                      value={formData.year_built}
                      onChange={e => setFormData(prev => ({ ...prev, year_built: e.target.value }))}
                      placeholder="1985"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asking_price">Asking Price ($) *</Label>
                    <Input
                      id="asking_price"
                      type="number"
                      value={formData.asking_price}
                      onChange={e => setFormData(prev => ({ ...prev, asking_price: e.target.value }))}
                      placeholder="150000"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arv">ARV - After Repair Value ($)</Label>
                    <Input
                      id="arv"
                      type="number"
                      value={formData.arv}
                      onChange={e => setFormData(prev => ({ ...prev, arv: e.target.value }))}
                      placeholder="250000"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repair_estimate">Repair Estimate ($)</Label>
                    <Input
                      id="repair_estimate"
                      type="number"
                      value={formData.repair_estimate}
                      onChange={e => setFormData(prev => ({ ...prev, repair_estimate: e.target.value }))}
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment_fee">Assignment Fee ($)</Label>
                    <Input
                      id="assignment_fee"
                      type="number"
                      value={formData.assignment_fee}
                      onChange={e => setFormData(prev => ({ ...prev, assignment_fee: e.target.value }))}
                      placeholder="10000"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equity_percentage">Equity %</Label>
                    <Input
                      id="equity_percentage"
                      type="number"
                      value={formData.equity_percentage}
                      onChange={e => setFormData(prev => ({ ...prev, equity_percentage: e.target.value }))}
                      placeholder="30"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos
                </CardTitle>
                <CardDescription>Add up to 10 photos of the property</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {images.length < 10 && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photos ({images.length}/10)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description & Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Description & Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the property, the opportunity, and any relevant details for investors..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Deal Highlights</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.highlights.map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {highlight}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeHighlight(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={highlightInput}
                      onChange={e => setHighlightInput(e.target.value)}
                      placeholder="e.g., Motivated seller, Below market value"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                    />
                    <Button type="button" variant="outline" onClick={addHighlight}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="flex-1 md:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting Deal...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Post Deal
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
