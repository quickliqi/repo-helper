/**
 * Deal Validation Criteria for QuickLiqi Marketplace
 * 
 * All deals must meet these minimum standards to ensure quality:
 * 1. Asking price must be at most 70% of ARV (After Repair Value)
 * 2. All required fields must be complete
 * 3. At least one photo is required
 * 4. Seller must be verified
 */

export interface DealValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    arvPercentage: number | null;
    potentialProfit: number | null;
    equityPercentage: number | null;
  };
}

export interface DealData {
  title: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  deal_type: string;
  condition: string;
  asking_price: string | number;
  arv: string | number;
  repair_estimate?: string | number;
  description?: string;
  imageCount: number;
  isVerified: boolean;
}

const MAX_ARV_PERCENTAGE = 70; // Asking price must be <= 70% of ARV
const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 50;

export function validateDeal(data: DealData): DealValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const askingPrice = typeof data.asking_price === 'string' 
    ? parseFloat(data.asking_price) 
    : data.asking_price;
  
  const arv = typeof data.arv === 'string' 
    ? parseFloat(data.arv) 
    : data.arv;
  
  const repairEstimate = data.repair_estimate 
    ? (typeof data.repair_estimate === 'string' 
        ? parseFloat(data.repair_estimate) 
        : data.repair_estimate)
    : 0;

  // Calculate metrics
  const arvPercentage = arv && askingPrice ? (askingPrice / arv) * 100 : null;
  const potentialProfit = arv && askingPrice ? arv - askingPrice - repairEstimate : null;
  const equityPercentage = arv && askingPrice ? ((arv - askingPrice) / arv) * 100 : null;

  // === REQUIRED FIELD VALIDATION ===
  
  // Verification check
  if (!data.isVerified) {
    errors.push('Identity verification required to post deals');
  }

  // Title validation
  if (!data.title?.trim()) {
    errors.push('Title is required');
  } else if (data.title.trim().length < MIN_TITLE_LENGTH) {
    errors.push(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
  }

  // Location validation
  if (!data.address?.trim()) {
    errors.push('Street address is required');
  }
  if (!data.city?.trim()) {
    errors.push('City is required');
  }
  if (!data.state) {
    errors.push('State is required');
  }
  if (!data.zip_code?.trim()) {
    errors.push('Zip code is required');
  }

  // Property details validation
  if (!data.property_type) {
    errors.push('Property type is required');
  }
  if (!data.deal_type) {
    errors.push('Deal type is required');
  }
  if (!data.condition) {
    errors.push('Property condition is required');
  }

  // === FINANCIAL VALIDATION (CRITICAL) ===
  
  if (!askingPrice || askingPrice <= 0) {
    errors.push('Asking price is required and must be greater than $0');
  }
  
  if (!arv || arv <= 0) {
    errors.push('ARV (After Repair Value) is required to verify deal quality');
  }

  // 70% ARV Rule - The key marketplace quality gate
  if (askingPrice && arv && arv > 0) {
    if (askingPrice > arv) {
      errors.push('Asking price cannot exceed ARV');
    } else if (arvPercentage && arvPercentage > MAX_ARV_PERCENTAGE) {
      errors.push(
        `Deal does not meet marketplace standards. Asking price ($${askingPrice.toLocaleString()}) is ${arvPercentage.toFixed(1)}% of ARV. ` +
        `Maximum allowed is ${MAX_ARV_PERCENTAGE}% ($${Math.floor(arv * (MAX_ARV_PERCENTAGE / 100)).toLocaleString()})`
      );
    }
  }

  // === PHOTO VALIDATION ===
  if (data.imageCount === 0) {
    errors.push('At least one property photo is required');
  }

  // === WARNINGS (Non-blocking but recommended) ===
  
  if (!data.description?.trim() || data.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    warnings.push('Adding a detailed description helps attract serious investors');
  }

  if (!repairEstimate || repairEstimate <= 0) {
    warnings.push('Including a repair estimate helps investors evaluate the deal');
  }

  if (data.imageCount < 3) {
    warnings.push('Properties with 3+ photos get 2x more inquiries');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      arvPercentage,
      potentialProfit,
      equityPercentage,
    },
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: DealValidationResult): string {
  if (result.isValid) return '';
  return result.errors.join('\n');
}

/**
 * Get deal quality tier based on ARV percentage
 */
export function getDealQualityTier(arvPercentage: number | null): {
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
} {
  if (!arvPercentage) {
    return { tier: 'poor', label: 'Unknown', color: 'text-muted-foreground' };
  }
  
  if (arvPercentage <= 60) {
    return { tier: 'excellent', label: 'Excellent Deal', color: 'text-success' };
  }
  if (arvPercentage <= 65) {
    return { tier: 'good', label: 'Good Deal', color: 'text-primary' };
  }
  if (arvPercentage <= 70) {
    return { tier: 'fair', label: 'Fair Deal', color: 'text-amber-500' };
  }
  return { tier: 'poor', label: 'Does Not Qualify', color: 'text-destructive' };
}
