
/**
 * Deduplication Engine
 *
 * Provides hash-based and fuzzy deduplication for scraped deals.
 * - Address hash: normalized address+city+state+price band
 * - Fuzzy title matching via Levenshtein distance
 * - Cross-session dedup via scraper_dedup_hashes table
 */

import { ScrapedDeal } from "../types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface DedupResult {
    isDuplicate: boolean;
    duplicateOf?: number;           // index in current batch
    crossSessionDuplicate?: boolean; // found in DB from prior session
    matchType?: 'exact_hash' | 'fuzzy_title' | 'price_proximity';
    similarity?: number;            // 0-100
}

export interface DedupReport {
    totalDeals: number;
    uniqueCount: number;
    duplicateCount: number;
    perDeal: {
        dealIndex: number;
        title: string;
        result: DedupResult;
    }[];
}

/**
 * Normalize and hash an address for dedup comparison.
 */
function normalizeAddress(deal: ScrapedDeal): string {
    const parts = [
        (deal.address || deal.title || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
        (deal.city || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
        (deal.state || '').toLowerCase().replace(/[^a-z]/g, ''),
    ];
    return parts.join('|');
}

/**
 * Simple price band hash — groups prices within 5% bands.
 */
function priceBand(price: number, variance: number): string {
    if (!price || price <= 0) return '0';
    const bandSize = Math.max(1000, Math.round(price * (variance / 100)));
    return String(Math.floor(price / bandSize));
}

/**
 * Levenshtein distance between two strings (for fuzzy title matching).
 */
function levenshtein(a: string, b: string): number {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;

    const matrix: number[][] = [];
    for (let i = 0; i <= an; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= bn; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[an][bn];
}

/**
 * Calculate similarity percentage between two strings.
 */
function similarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 100;
    const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
    return Math.round(((maxLen - dist) / maxLen) * 100);
}

/**
 * Run deduplication on a batch of deals.
 * Checks within-batch and optionally cross-session via DB.
 */
export async function runDedup(
    deals: ScrapedDeal[],
    supabaseClient: any,
    priceVariance: number = 5
): Promise<DedupReport> {
    const hashMap = new Map<string, number>();
    const titleMap = new Map<string, number>();
    const results: DedupReport['perDeal'] = [];

    // Collect all hashes for cross-session check
    const allHashes = deals.map(d => normalizeAddress(d));

    // Attempt cross-session lookup (fire and forget if it fails)
    let existingHashes = new Set<string>();
    try {
        const { data } = await supabaseClient
            .from('scraper_dedup_hashes')
            .select('address_hash')
            .in('address_hash', allHashes);
        if (data) {
            existingHashes = new Set(data.map((r: { address_hash: string }) => r.address_hash));
        }
    } catch {
        console.warn('[DEDUP] Cross-session lookup failed, continuing with batch-only dedup');
    }

    for (let i = 0; i < deals.length; i++) {
        const deal = deals[i];
        const hash = allHashes[i];
        const titleNorm = (deal.title || '').toLowerCase().trim();
        const price = deal.asking_price || deal.price;

        let result: DedupResult = { isDuplicate: false };

        // 1. Cross-session exact hash match
        if (existingHashes.has(hash)) {
            result = {
                isDuplicate: true,
                crossSessionDuplicate: true,
                matchType: 'exact_hash',
                similarity: 100,
            };
        }

        // 2. Within-batch exact hash match
        if (!result.isDuplicate && hashMap.has(hash)) {
            result = {
                isDuplicate: true,
                duplicateOf: hashMap.get(hash),
                matchType: 'exact_hash',
                similarity: 100,
            };
        }

        // 3. Fuzzy title match (only if not already flagged)
        if (!result.isDuplicate && titleNorm.length > 10) {
            for (const [existingTitle, existingIdx] of titleMap.entries()) {
                const sim = similarity(titleNorm, existingTitle);
                if (sim >= 85) {
                    // Also check price proximity
                    const existingPrice = deals[existingIdx].asking_price || deals[existingIdx].price;
                    const priceDeviation = existingPrice > 0
                        ? Math.abs(price - existingPrice) / existingPrice * 100
                        : 100;

                    if (priceDeviation <= priceVariance) {
                        result = {
                            isDuplicate: true,
                            duplicateOf: existingIdx,
                            matchType: 'fuzzy_title',
                            similarity: sim,
                        };
                        break;
                    }
                }
            }
        }

        // 4. Price proximity at same address
        if (!result.isDuplicate) {
            // Simple check: if same address hash exists with a very close price (already covered by exact hash if strings identical)
            // This loop checks previously processed items in current batch
            for (let j = 0; j < i; j++) {
                const otherHash = allHashes[j];
                if (otherHash === hash) {
                    const otherPrice = deals[j].asking_price || deals[j].price;
                    const priceDeviation = otherPrice > 0
                        ? Math.abs(price - otherPrice) / otherPrice * 100
                        : 100;
                    if (priceDeviation <= priceVariance) {
                        result = {
                            isDuplicate: true,
                            duplicateOf: j,
                            matchType: 'price_proximity',
                            similarity: Math.round(100 - priceDeviation),
                        };
                        break;
                    }
                }
            }
        }

        // Register in maps for later comparisons
        if (!hashMap.has(hash)) hashMap.set(hash, i);
        if (titleNorm.length > 5 && !titleMap.has(titleNorm)) titleMap.set(titleNorm, i);

        results.push({
            dealIndex: i,
            title: deal.title || `Deal #${i + 1}`,
            result,
        });
    }

    const duplicateCount = results.filter(r => r.result.isDuplicate).length;

    return {
        totalDeals: deals.length,
        uniqueCount: deals.length - duplicateCount,
        duplicateCount,
        perDeal: results,
    };
}

export async function registerDedupHashes(
    deals: ScrapedDeal[],
    dedupReport: DedupReport,
    supabaseClient: any
): Promise<void> {
    const uniqueDeals = dedupReport.perDeal
        .filter(d => !d.result.isDuplicate)
        .map(d => deals[d.dealIndex]);

    if (uniqueDeals.length === 0) return;

    const rows = uniqueDeals.map(deal => ({
        address_hash: normalizeAddress(deal),
        price: deal.asking_price || deal.price,
        source: deal.source || 'unknown',
    }));

    try {
        await supabaseClient
            .from('scraper_dedup_hashes')
            .upsert(rows, { onConflict: 'address_hash' });
    } catch (err) {
        console.error('[DEDUP] Failed to register hashes:', err);
    }
}
