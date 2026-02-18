export type AppRole = 'investor' | 'wholesaler' | 'admin';
export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'commercial' | 'land' | 'mobile_home' | 'other';
export type DealType = 'fix_and_flip' | 'buy_and_hold' | 'wholesale' | 'subject_to' | 'seller_finance' | 'other';
export type PropertyCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'distressed';
export type PropertyStatus = 'active' | 'under_contract' | 'pending' | 'sold' | 'withdrawn';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  state?: string;
  is_verified: boolean;
  verification_status?: VerificationStatus;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  selfie_url?: string;
  status: VerificationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface BuyBox {
  id: string;
  user_id: string;
  name: string;
  property_types: PropertyType[];
  deal_types: DealType[];
  min_price?: number;
  max_price?: number;
  min_arv?: number;
  max_arv?: number;
  min_equity_percentage?: number;
  preferred_conditions: PropertyCondition[];
  target_cities: string[];
  target_states: string[];
  target_zip_codes: string[];
  max_radius_miles?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  title: string;
  address: string;
  listing_url?: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: PropertyType;
  deal_type: DealType;
  condition: PropertyCondition;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size_sqft?: number;
  year_built?: number;
  asking_price: number;
  arv?: number;
  repair_estimate?: number;
  assignment_fee?: number;
  equity_percentage?: number;
  description?: string;
  highlights?: string[];
  image_urls: string[];
  status: PropertyStatus;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  property_id: string;
  buy_box_id: string;
  investor_id: string;
  match_score: number;
  is_viewed: boolean;
  is_saved: boolean;
  is_contacted: boolean;
  created_at: string;
  property?: Property;
  buy_box?: BuyBox;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_property_id?: string;
  related_match_id?: string;
  created_at: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: 'Single Family',
  multi_family: 'Multi-Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
  commercial: 'Commercial',
  land: 'Land',
  mobile_home: 'Mobile Home',
  other: 'Other',
};

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  fix_and_flip: 'Fix & Flip',
  buy_and_hold: 'Buy & Hold',
  wholesale: 'Wholesale',
  subject_to: 'Subject To',
  seller_finance: 'Seller Finance',
  other: 'Other',
};

export const CONDITION_LABELS: Record<PropertyCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  distressed: 'Distressed',
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  active: 'Active',
  under_contract: 'Under Contract',
  pending: 'Pending',
  sold: 'Sold',
  withdrawn: 'Withdrawn',
};

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];