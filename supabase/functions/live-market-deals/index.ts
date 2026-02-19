import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { fetchPublicRecords } from "../_shared/dataTriangulation.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { location, max_price, min_beds, max_dom } = await req.json();

        const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
        if (!RAPIDAPI_KEY) {
            console.warn("[live-market-deals] RAPIDAPI_KEY not set — returning empty array.");
            return new Response(JSON.stringify([]), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const encodedLocation = encodeURIComponent(location || "");
        const apiUrl = `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?location=${encodedLocation}&status_type=ForSale`;

        const apiRes = await fetch(apiUrl, {
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
            },
        });

        if (!apiRes.ok) {
            console.error("[live-market-deals] RapidAPI error:", apiRes.status, await apiRes.text());
            return new Response(JSON.stringify([]), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const data = await apiRes.json();
        let props: any[] = data.props || [];

        // Apply optional filters
        if (max_price) props = props.filter((p) => !p.price || p.price <= max_price);
        if (min_beds) props = props.filter((p) => !p.bedrooms || p.bedrooms >= min_beds);
        if (max_dom) props = props.filter((p) => !p.daysOnZillow || p.daysOnZillow <= max_dom);

        // Fetch public records concurrently for triangulation
        const deals = await Promise.all(
            props.map(async (prop: any) => {
                const baseData = {
                    sqft: prop.livingArea,
                    price: prop.price,
                    bedrooms: prop.bedrooms,
                };
                const address = prop.address || location;
                const data_integrity = await fetchPublicRecords(address, baseData);

                return {
                    address: prop.address || "Address unavailable",
                    url: `https://www.zillow.com/homedetails/${prop.zpid}_zpid/`,
                    list_price: prop.price ? `$${prop.price.toLocaleString()}` : "N/A",
                    dom: prop.daysOnZillow ?? null,
                    data_integrity,
                };
            })
        );

        return new Response(JSON.stringify(deals), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("[live-market-deals] Unexpected error:", err);
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
