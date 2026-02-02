
# QuickLiqi Complete Platform Upgrade Plan

## Overview

This plan transforms QuickLiqi into a production-ready, professional real estate platform by addressing branding inconsistencies, security vulnerabilities, payment gateway improvements, identity verification, and user experience enhancements.

---

## Phase 1: Branding Consistency

### 1.1 Frontend Branding Updates

**Files to update:**

| File | Current State | Changes |
|------|---------------|---------|
| `src/pages/Auth.tsx` | Shows "DealMatch" branding, blue colors (#1a365d) | Update to "QuickLiqi", green (#10b981) |
| `src/pages/ProfileSetup.tsx` | Shows "DealMatch" on line 189, 206 | Update to "QuickLiqi" |
| `src/pages/Pricing.tsx` | Meta title says "DealFlow" on line 104 | Update to "QuickLiqi" |

**Auth.tsx specific changes:**
- Line 98: Change "DealMatch" to "QuickLiqi" in logo
- Line 103: Update gradient to green theme
- Line 112-126: Update feature icons and colors
- Line 153: Change title text

**ProfileSetup.tsx specific changes:**
- Line 189: Change "DealMatch" to "QuickLiqi"
- Line 206: Change welcome message to "QuickLiqi"

**Pricing.tsx specific changes:**
- Line 104: Fix Helmet title from "DealFlow" to "QuickLiqi"

---

### 1.2 Edge Function Email Updates

All email functions need sender updated from `@resend.dev` to `noreply@send.quickliqi.com` and branding updated from "DealMatch"/"DealFlow" to "QuickLiqi":

| Edge Function | Lines to Update | Changes |
|--------------|-----------------|---------|
| `send-welcome-email/index.ts` | Lines 70-71, 82, 102-141 | URLs to quickliqi.lovable.app, sender to QuickLiqi, branding throughout, green colors (#10b981) |
| `send-notification-email/index.ts` | Lines 58, 65, 86, 122, 134, 242 | Change "DealFlow" to "QuickLiqi", update URLs, sender email |
| `send-verification-email/index.ts` | Lines 59, 74, 82, 85, 120, 131-132 | Change "DealMatch" to "QuickLiqi", update URLs and sender |
| `send-purchase-confirmation/index.ts` | Lines 37, 59-60, 91, 96-97, 137, 145-146, 155 | Change "DealFlow" to "QuickLiqi", update URLs |

**Color scheme for emails:**
- Primary: #10b981 (green) instead of #1a365d (navy)
- Links and buttons: #10b981

---

### 1.3 Payment Gateway URL Updates

Edge functions with hardcoded fallback URLs need updating:

| Edge Function | Line | Current | Update To |
|--------------|------|---------|-----------|
| `create-checkout/index.ts` | 85 | `https://dealflow.app` | `https://quickliqi.lovable.app` |
| `customer-portal/index.ts` | 77 | `https://dealflow.app` | `https://quickliqi.lovable.app` |
| `buy-listing-credits/index.ts` | 76 | `https://dealflow.app` | `https://quickliqi.lovable.app` |
| `scrape-subscription-checkout/index.ts` | 78 | `https://clone-friendly-helper.lovable.app` | `https://quickliqi.lovable.app` |

---

## Phase 2: Security Hardening

### 2.1 Enable Leaked Password Protection

Use the auth configuration tool to enable:
- Leaked password protection (checks against breach databases)
- This prevents users from signing up with compromised passwords

### 2.2 Strengthen Password Requirements

Update `src/pages/Auth.tsx` password validation:
- Current: 6 character minimum
- New: 8 character minimum with complexity indicator

### 2.3 Fix RLS Policy

The linter detected an overly permissive INSERT policy on `email_leads` table:
```sql
-- Current: WITH CHECK (true) - allows anyone to insert anything
-- This is acceptable for a public lead capture form, but should be documented
```

**Assessment:** The `email_leads` table INSERT policy using `true` is intentional for public lead capture. No change needed but should be monitored.

### 2.4 Add Email Confirmation Flow

Enable email confirmation in auth settings:
- Users must verify email before accessing protected features
- Add clear instructions on Auth page after signup

---

## Phase 3: Identity Verification System

### 3.1 Re-enable Verification Banner

Update `src/components/verification/VerificationBanner.tsx`:
- Currently returns `null` on line 15
- Re-enable the banner logic to show verification status

### 3.2 Re-enable Verification Gates

Update these files to enforce verification:

**For Wholesalers (PostDeal.tsx):**
- Add verification check before allowing deal posting
- Show verification prompt if not verified

**For Investors (PropertyDetail.tsx):**
- Line 62: Re-enable verification check for contacting sellers
- Gate messaging functionality behind verification

### 3.3 Improve Verification Flow

Update `src/pages/Verify.tsx`:
- Add clearer instructions for document upload
- Explain why verification is needed
- Show estimated review time (24-48 hours)
- Support both front and back of ID

---

## Phase 4: User Experience Improvements

### 4.1 Auth Page Enhancements

**Add to `src/pages/Auth.tsx`:**
1. "Forgot password?" link (line ~225)
2. Password visibility toggle
3. Password strength indicator
4. Post-signup email confirmation message

### 4.2 Fix View Count Bug

**Update `src/pages/PropertyDetail.tsx` line 127-138:**
```typescript
// Current (buggy - uses stale data):
.update({ views_count: (property?.views_count || 0) + 1 })

// Fix: Use SQL increment to avoid race conditions
.rpc('increment_views', { property_id: id })
```

Create database function for atomic increment.

### 4.3 Dashboard Status Visibility

Update dashboards to prominently show:
- Verification status
- Subscription/trial status
- Credits remaining (wholesalers)
- Pending matches count (investors)

---

## Phase 5: Payment Gateway Integration

### 5.1 Current Payment Setup (Already Working)

The platform has Stripe integration with:
- Investor Pro subscription: $49/month with 7-day trial
- Listing credits: $10 per credit
- AI Scraper subscription: $100/month for 10 scrapes

**Stripe Product IDs (already configured):**
- Investor Pro: `price_1SjI8j0VL3B5XXLHB1xRD8Bb`
- Listing Credit: `price_1SjI9J0VL3B5XXLH4pGYfKkC`
- Scrape Subscription: `price_1SkekM0VL3B5XXLHuT9r6FIr`

### 5.2 Payment Flow Improvements

1. Update all edge function fallback URLs to `quickliqi.lovable.app`
2. Update confirmation emails with correct branding
3. Add receipt links in confirmation emails

---

## Implementation Order

### Batch 1: Branding (Immediate)
1. Update Auth.tsx branding
2. Update ProfileSetup.tsx branding  
3. Update Pricing.tsx meta tags
4. Update all 5 email edge functions

### Batch 2: Security (Day 1)
1. Enable leaked password protection
2. Increase password minimum to 8 characters
3. Document RLS policy decisions

### Batch 3: Payment URLs (Day 1)
1. Update create-checkout fallback URL
2. Update customer-portal fallback URL
3. Update buy-listing-credits fallback URL
4. Update scrape-subscription-checkout fallback URL

### Batch 4: Verification System (Day 2)
1. Re-enable VerificationBanner component
2. Add verification gate to PostDeal.tsx
3. Add verification gate to PropertyDetail.tsx messaging

### Batch 5: UX Improvements (Day 2-3)
1. Add forgot password link
2. Fix view count increment bug
3. Add password strength indicator

---

## Files to Modify Summary

| Category | Files | Priority |
|----------|-------|----------|
| Frontend Branding | 3 files (Auth, ProfileSetup, Pricing) | High |
| Email Functions | 4 edge functions | High |
| Payment URLs | 4 edge functions | High |
| Security Config | Auth settings | Critical |
| Verification | 3 files (Banner, PostDeal, PropertyDetail) | Medium |
| UX Improvements | 2 files (Auth, PropertyDetail) | Medium |

**Total: 14 files to modify**

---

## Technical Notes

### Database Changes Required

1. **Create atomic view increment function:**
```sql
CREATE OR REPLACE FUNCTION increment_views(property_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE properties 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Function Deployments

All modified edge functions will auto-deploy on save. No manual deployment needed.

### Email Domain Verification

The domain `send.quickliqi.com` must be verified in Resend dashboard for emails to send successfully. This was already set up for `test-email` function.

---

## Summary

This upgrade plan addresses:
- 10+ branding inconsistencies across frontend and email functions
- 2 security warnings (leaked password protection, RLS review)
- 4 payment gateway URL misconfigurations
- Disabled verification system that needs re-enabling
- UX improvements including password reset and bug fixes

After implementation, QuickLiqi will be a professional, secure platform ready for production use.
