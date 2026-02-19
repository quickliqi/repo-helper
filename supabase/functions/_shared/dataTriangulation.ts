/**
 * Data Triangulation Utility — Live Regrid v2 Diff Engine
 * Compares county assessor data (Regrid) against Zillow listing data.
 * Estated removed — migrating to ATTOM. 2-way comparison only.
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
        console.warn("Missing REGRID_API_KEY. Returning default integrity data.");
        return {
            confidence_score: 50,
            verified_matches: {},
            discrepancies: { "API": { source_a: "Missing Key", source_b: "N/A" } },
        };
    }

    try {
        // Call Regrid v2 Address Endpoint
        const regridUrl = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(address)}&token=${regridKey}`;
        const res = await fetch(regridUrl);

        if (res.ok) {
            const data = await res.json();

            // Extract properties if a parcel was found
            if (data.parcels?.features?.length > 0) {
                const countyData = data.parcels.features[0].properties.fields;

                // 1. Compare Square Footage
                // Regrid uses various sqft fields depending on the county
                const countySqft = countyData.ll_bldg_area_sq_ft || countyData.sqft || countyData.bldg_sqft;
                if (countySqft && baseData.sqft) {
                    // Allow a 5% margin of error for unpermitted additions
                    const diff = Math.abs(countySqft - baseData.sqft) / baseData.sqft;
                    if (diff > 0.05) {
                        discrepancies['Square Footage'] = {
                            source_a: `${baseData.sqft} (Listing)`,
                            source_b: `${countySqft} (County)`,
                        };
                        confidence_score -= 15;
                    } else {
                        verified_matches['Square Footage'] = countySqft;
                    }
                }

                // 2. Owner & Zoning (informational — always add to verified)
                if (countyData.owner) {
                    verified_matches['County Owner'] = countyData.owner;
                }
                if (countyData.zoning || countyData.zoning_description) {
                    verified_matches['Zoning'] = countyData.zoning || countyData.zoning_description;
                }

            } else {
                confidence_score -= 20;
                discrepancies['Record Match'] = {
                    source_a: "Listing Found",
                    source_b: "No County Parcel Found",
                };
            }
        } else {
            console.error("[dataTriangulation] Regrid API Error:", res.status, await res.text());
        }
    } catch (error) {
        console.error("[dataTriangulation] Failed to fetch from Regrid:", error);
    }

    // Ensure confidence score doesn't drop below 0
    confidence_score = Math.max(0, confidence_score);

    return {
        confidence_score,
        verified_matches,
        discrepancies,
    };
}
