/**
 * Data Triangulation Utility — Public Records Diff Engine
 * Compares public record data (Regrid, Estated) against Zillow listing data.
 */

export interface DataIntegrity {
    confidence_score: number;
    verified_matches: Record<string, any>;
    discrepancies: Record<string, { source_a: any; source_b: any }>;
}

interface PublicRecord {
    sqft?: number;
    price?: number;
    bedrooms?: number;
    owner?: string;
    assessed_value?: number;
    year_built?: number;
}

// ---------------------------------------------------------------------------
// Mock public record (fallback when API keys are not available)
// ---------------------------------------------------------------------------
function buildMockRecord(baseData: any): PublicRecord {
    // Simulate slight discrepancies for dev / demo purposes
    return {
        sqft: baseData.sqft ? baseData.sqft - 50 : 1200,
        price: baseData.price ? Math.round(baseData.price * 0.92) : undefined,
        bedrooms: baseData.bedrooms ?? 3,
        owner: "Mock County Records",
        assessed_value: baseData.price ? Math.round(baseData.price * 0.85) : undefined,
        year_built: 1998,
    };
}

// ---------------------------------------------------------------------------
// Regrid API fetch skeleton
// ---------------------------------------------------------------------------
async function fetchRegrid(
    address: string,
    apiKey: string
): Promise<PublicRecord | null> {
    try {
        const encoded = encodeURIComponent(address);
        const res = await fetch(
            `https://app.regrid.com/api/v1/parcel/address?query=${encoded}&token=${apiKey}&format=json`,
            { headers: { Accept: "application/json" } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const parcel = data?.results?.[0]?.fields;
        if (!parcel) return null;
        return {
            sqft: parcel.ll_gisacres ? Math.round(parcel.ll_gisacres * 43560) : undefined,
            bedrooms: parcel.struct_bed ? Number(parcel.struct_bed) : undefined,
            owner: parcel.owner,
            assessed_value: parcel.saleprice ? Number(parcel.saleprice) : undefined,
            year_built: parcel.struct_year_built ? Number(parcel.struct_year_built) : undefined,
        };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Estated API fetch skeleton
// ---------------------------------------------------------------------------
async function fetchEstated(
    address: string,
    apiKey: string
): Promise<PublicRecord | null> {
    try {
        const parts = address.split(",");
        const street = encodeURIComponent((parts[0] || "").trim());
        const city = encodeURIComponent((parts[1] || "").trim());
        const state = encodeURIComponent((parts[2] || "").trim());
        const res = await fetch(
            `https://apis.estated.com/v4/property?token=${apiKey}&street_address=${street}&city=${city}&state=${state}`,
            { headers: { Accept: "application/json" } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const prop = data?.data;
        if (!prop) return null;
        return {
            sqft: prop.structure?.total_area_sq_ft,
            bedrooms: prop.structure?.beds_count,
            price: prop.valuation?.value,
            assessed_value: prop.assessments?.[0]?.total_value,
            year_built: prop.structure?.year_built,
            owner: prop.owner?.name,
        };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Diff Engine
// ---------------------------------------------------------------------------
function runDiffEngine(baseData: any, publicRecord: PublicRecord): DataIntegrity {
    const checks: Array<{ key: string; base: any; record: any }> = [
        { key: "sqft", base: baseData.sqft, record: publicRecord.sqft },
        { key: "price", base: baseData.price, record: publicRecord.price },
        { key: "bedrooms", base: baseData.bedrooms, record: publicRecord.bedrooms },
    ];

    const verified_matches: Record<string, any> = {};
    const discrepancies: Record<string, { source_a: any; source_b: any }> = {};

    for (const { key, base, record } of checks) {
        if (base == null || record == null) continue;

        // Allow 5% tolerance for numeric drift
        const pctDiff = Math.abs(base - record) / (Math.max(base, record) || 1);
        if (pctDiff <= 0.05) {
            verified_matches[key] = base;
        } else {
            discrepancies[key] = { source_a: base, source_b: record };
        }
    }

    // Confidence = 100 minus 20 per discrepancy, minimum 0
    const confidence_score = Math.max(
        0,
        100 - Object.keys(discrepancies).length * 20
    );

    return { confidence_score, verified_matches, discrepancies };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function fetchPublicRecords(
    address: string,
    baseData: any
): Promise<DataIntegrity> {
    const REGRID_KEY = Deno.env.get("REGRID_API_KEY");
    const ESTATED_KEY = Deno.env.get("ESTATED_API_KEY");

    let publicRecord: PublicRecord | null = null;

    if (REGRID_KEY || ESTATED_KEY) {
        const [regridData, estatedData] = await Promise.all([
            REGRID_KEY ? fetchRegrid(address, REGRID_KEY) : Promise.resolve(null),
            ESTATED_KEY ? fetchEstated(address, ESTATED_KEY) : Promise.resolve(null),
        ]);

        // Prefer Estated, fall back to Regrid, merge where possible
        publicRecord = {
            ...regridData,
            ...estatedData,
        };
    }

    // If no keys or fetches failed, use mock data
    if (!publicRecord || Object.keys(publicRecord).length === 0) {
        console.warn(
            `[dataTriangulation] No API keys — using mock public record for: ${address}`
        );
        publicRecord = buildMockRecord(baseData);
    }

    return runDiffEngine(baseData, publicRecord);
}
