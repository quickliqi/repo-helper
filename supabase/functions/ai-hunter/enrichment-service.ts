
/**
 * Enrichment Service
 * 
 * Fetches public assessor records for a given address using 
 * external property data APIs (RealtyMole, RentCast, etc.)
 */

export interface AssessorData {
    apn: string | null;
    assessed_value: number | null;
    annual_taxes: number | null;
    last_sale_date: string | null;
    last_sale_price: number | null;
    sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    year_built: number | null;
    land_use: string | null;
    official_address: string | null;
}

const PROPERTY_DATA_API_KEY = Deno.env.get("PROPERTY_DATA_API_KEY") || "";

/**
 * Fetch public record enrichment for a given address
 */
export async function fetchEnrichmentData(address: string, city: string, state: string, zip?: string): Promise<AssessorData | null> {
    if (!PROPERTY_DATA_API_KEY) {
        console.warn("[ENRICHMENT-SERVICE] Missing PROPERTY_DATA_API_KEY. Skipping enrichment.");
        return null;
    }

    try {
        console.log(`[ENRICHMENT-SERVICE] Fetching data for: ${address}, ${city}, ${state}`);

        // Using RealtyMole as the default implementation
        // Endpoint: GET https://realty-mole-property-api.p.rapidapi.com/properties
        const url = new URL("https://realty-mole-property-api.p.rapidapi.com/properties");
        url.searchParams.append("address", address);
        url.searchParams.append("city", city);
        url.searchParams.append("state", state);
        if (zip) url.searchParams.append("zipCode", zip);

        const response = await fetch(url.toString(), {
            headers: {
                "X-RapidAPI-Key": PROPERTY_DATA_API_KEY,
                "X-RapidAPI-Host": "realty-mole-property-api.p.rapidapi.com"
            }
        });

        if (!response.ok) {
            console.error(`[ENRICHMENT-SERVICE] API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        // Return first match if array or the object itself
        const property = Array.isArray(data) ? data[0] : data;

        if (!property) return null;

        return {
            apn: property.parcelNumber || property.apn || null,
            assessed_value: property.assessedValue || null,
            annual_taxes: property.taxAmount || null,
            last_sale_date: property.lastSaleDate || null,
            last_sale_price: property.lastSalePrice || null,
            sqft: property.squareFootage || property.sqft || null,
            bedrooms: property.bedrooms || null,
            bathrooms: property.bathrooms || null,
            year_built: property.yearBuilt || null,
            land_use: property.propertyType || property.landUse || null,
            official_address: property.address || null
        };
    } catch (err) {
        console.error("[ENRICHMENT-SERVICE] Unexpected error:", err);
        return null;
    }
}
