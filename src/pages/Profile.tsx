import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { US_STATES } from '@/types/database';
import { 
  User, 
  Building2, 
  Phone, 
  MapPin,
  Camera,
  Save,
  Loader2,
  Shield,
  DollarSign
} from 'lucide-react';

interface ProfileFormData {
  full_name: string;
  company_name: string;
  phone: string;
  bio: string;
  city: string;
  state: string;
  is_actively_buying: boolean;
}

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    company_name: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    is_actively_buying: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        city: profile.city || '',
        state: profile.state || '',
        is_actively_buying: (profile as any).is_actively_buying ?? true,
      });
      setAvatarPreview(profile.avatar_url || null);
      setIsLoading(false);
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return profile?.avatar_url || null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || null;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          company_name: formData.company_name.trim() || null,
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state || null,
          avatar_url: avatarUrl,
          is_actively_buying: formData.is_actively_buying,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
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
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {formData.full_name?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  {formData.full_name || 'Your Profile'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {role}
                  </Badge>
                  {profile?.verification_status === 'approved' || profile?.is_verified ? (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : profile?.verification_status === 'pending' ? (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Pending Verification
                    </Badge>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <a href="/verify">
                        <Shield className="h-3 w-3 mr-1" />
                        Get Verified
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself and your investment focus..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investor Status - Only show for investors */}
            {role === 'investor' && (
              <Card className="border-accent/30 bg-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-accent" />
                    Buying Status
                  </CardTitle>
                  <CardDescription>
                    Let wholesalers know if you're actively looking for deals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="actively_buying" className="text-base font-medium">
                        I'm actively seeking to purchase
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.is_actively_buying 
                          ? "You'll receive match notifications and appear as an active buyer"
                          : "You won't receive new match notifications"}
                      </p>
                    </div>
                    <Switch
                      id="actively_buying"
                      checked={formData.is_actively_buying}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_actively_buying: checked }))}
                      className="data-[state=checked]:bg-accent"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Add your business details for professional networking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="ABC Investments LLC"
                  />
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
                <CardDescription>
                  Your location helps wholesalers find local investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Miami"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
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
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Input
                    value={role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
                    disabled
                    className="bg-muted capitalize"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button type="submit" size="lg" disabled={isSaving} className="w-full md:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
