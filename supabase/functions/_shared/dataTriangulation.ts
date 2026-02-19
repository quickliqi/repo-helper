/**
 * Data Triangulation Utility — Live Regrid V2 Diff Engine
 * Compares county assessor data (Regrid V2 schema) against Zillow listing data.
 * V2 schema fields: area_building, parval, owner, zoning_description
 */

export interface DataIntegrity {
    confidence_score: number;
    verified_matches: Record<string, any>;
    discrepancies: Record<string, { source_a: any; source_b: any }>;
}

export async function fetchPublicRecords(address: string, baseData: any): Promise<DataIntegrity> {
    const regridKey = Deno.env.get('REGRID_API_KEY');

    const verified_matches: Record<string, any> = {};
    const discrepancies: Record<string, { source_a: any; source_b: any }> = {};
    let confidence_score = 100;

    if (!regridKey) {
        console.warn("[dataTriangulation] Missing REGRID_API_KEY. Returning default integrity data.");
        return {
            confidence_score: 50,
            verified_matches: {},
            discrepancies: { "API Key": { source_a: "Missing REGRID_API_KEY", source_b: "N/A" } },
        };
    }

    try {
        // Stage 2.1: Regrid V2 address endpoint
        const regridUrl = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(address)}&token=${regridKey}`;
        const res = await fetch(regridUrl);

        if (!res.ok) {
            console.error("[dataTriangulation] Regrid API non-200:", res.status, await res.text());
            // Degrade gracefully rather than crash
            return {
                confidence_score: 50,
                verified_matches: {},
                discrepancies: { "Regrid API": { source_a: `HTTP ${res.status}`, source_b: "County data unavailable" } },
            };
        }

        const data = await res.json();

        if (data.parcels?.features?.length > 0) {
            const countyData = data.parcels.features[0].properties.fields;

            // ── Square Footage ────────────────────────────────────────────────
            // Prioritize area_building (habitable area) per V2 schema, fall back to sqft
            const countySqft = countyData.area_building ?? countyData.sqft ?? countyData.ll_bldg_area_sq_ft;
            if (countySqft && baseData.sqft) {
                const diff = Math.abs(countySqft - baseData.sqft) / baseData.sqft;
                if (diff > 0.05) {
                    discrepancies['Square Footage'] = {
                        source_a: `${baseData.sqft.toLocaleString()} sq ft (Listing)`,
                        source_b: `${countySqft.toLocaleString()} sq ft (County)`,
                    };
                    confidence_score -= 15;
                } else {
                    verified_matches['Square Footage'] = `${countySqft.toLocaleString()} sq ft`;
                }
            }

            // ── County Assessed Value (parval) ────────────────────────────────
            if (countyData.parval) {
                verified_matches['County Assessed Value'] = `$${Number(countyData.parval).toLocaleString()}`;
            }

            // ── Owner of Record ────────────────────────────────────────────────
            if (countyData.owner) {
                verified_matches['Owner of Record'] = countyData.owner;
            }

            // ── Zoning ────────────────────────────────────────────────────────
            const zoning = countyData.zoning_description || countyData.zoning;
            if (zoning) {
                verified_matches['Zoning'] = zoning;
            }

        } else {
            // No parcel matched — reduce confidence, flag it
            confidence_score -= 20;
            discrepancies['Record Match'] = {
                source_a: "Listing Found",
                source_b: "No County Parcel Located",
            };
        }

    } catch (error) {
        // Never crash the parent function — degrade confidence and log
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[dataTriangulation] Regrid fetch failed:", msg);
        return {
            confidence_score: 50,
            verified_matches: {},
            discrepancies: { "Regrid Error": { source_a: msg, source_b: "County data unavailable" } },
        };
    }

    return {
        confidence_score: Math.max(0, confidence_score),
        verified_matches,
        discrepancies,
    };
}
