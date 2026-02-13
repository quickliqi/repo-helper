import { DealInput, DealMetrics } from '@/types/deal-types';
import { calculateDealMetrics, GovernanceSettings, DEFAULT_GOVERNANCE } from '@/lib/calculations';

export interface DealValidationResult {
  isValid: boolean;
  errors: string[];
  metrics: DealMetrics | null;
}

export function validateDeal(input: any, settings: GovernanceSettings = {}): DealValidationResult {
  const errors: string[] = [];
  const warnings: string[] = []; // Restore this if used, or remove usages

  // Helper to safely parse numbers
  const parseNum = (val: any) => (typeof val === 'string' ? parseFloat(val) : val) || 0;

  const askingPrice = parseNum(input.asking_price);
  const arv = parseNum(input.arv);
  const repairEstimate = parseNum(input.repair_estimate);

  // === REQUIRED FIELD VALIDATION ===
  if (!input.title?.trim()) errors.push('Title is required');
  if (!input.address?.trim()) errors.push('Address is required');
  if (!input.city?.trim()) errors.push('City is required');
  if (!input.state) errors.push('State is required');
  if (!input.zip_code?.trim()) errors.push('Zip code is required');
  if (!input.property_type) errors.push('Property type is required');
  if (!input.deal_type) errors.push('Deal type is required');
  if (!input.condition) errors.push('Property condition is required');

  // Verification check
  if (input.isVerified === false) { // Strict check if bool
    errors.push('Identity verification required to post deals');
  }

  // === FINANCIAL VALIDATION ===
  if (askingPrice <= 0) errors.push('Asking price must be greater than $0');
  if (arv <= 0) errors.push('ARV is required to verify deal quality');

  // Convert input to DealInput for calculation
  const dealInput: DealInput = {
    ...input,
    asking_price: askingPrice,
    arv: arv,
    repair_estimate: repairEstimate,
    assignment_fee: parseNum(input.assignment_fee),
  } as DealInput;

  const metrics = calculateDealMetrics(dealInput, settings);

  if (metrics) {
    if (metrics.equityPercentage < 0) {
      errors.push(`Negative Equity: Asking price exceeds ARV value.`);
    }

    // Dynamic MAO Check
    const maoFactor = settings.max_allowable_offer_factor ?? DEFAULT_GOVERNANCE.MAO_DISCOUNT_RATE;
    // We don't strictly block on dynamic MAO in this validation, but we could.
    // For now, let's keep the hard error only if it's REALLY bad, e.g. > ARV
    if (askingPrice > arv) {
      errors.push('Asking price cannot exceed ARV');
    }
  }

  // === PHOTO VALIDATION ===
  if (!input.imageCount || input.imageCount === 0) {
    errors.push('At least one property photo is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    metrics
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
