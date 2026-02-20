import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// NOTE: Regrid enrichment has been moved to ai-hunter post-filter stage.
// This function's only job is raw Zillow data ingestion + basic filtering.

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { location, max_price, min_beds, max_dom } = await req.json();

        // Stage 1.1: Harden key check — return a 401 to make the error explicit.
        const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
        if (!RAPIDAPI_KEY) {
            console.error("[live-market-deals] RAPIDAPI_KEY not set in environment variables.");
            return new Response(
                JSON.stringify({ error: "API key for live market data is not configured.", deals: [] }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const encodedLocation = encodeURIComponent(location || "");
        // Construct the API URL. Note: `status_type=ForSale` is a default.
        const apiUrl = `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?location=${encodedLocation}&status_type=ForSale`;

        let data: any;
        try {
            const apiRes = await fetch(apiUrl, {
                headers: {
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
                },
            });

            // Explicit non-ok response. This catches 4xx/5xx errors from RapidAPI.
            if (!apiRes.ok) {
                const errorText = await apiRes.text();
                console.error(`[live-market-deals] RapidAPI returned a non-200 status: ${apiRes.status}. Response: ${errorText}`);
                const userFriendlyError = apiRes.status === 401 || apiRes.status === 403
                    ? "Invalid API key for live market data."
                    : `Live market API failed with status ${apiRes.status}.`;
                
                return new Response(
                    JSON.stringify({ error: userFriendlyError, status: apiRes.status, details: errorText, deals: [] }),
                    { status: apiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            data = await apiRes.json();
        } catch (fetchErr) {
            const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
            console.error("[live-market-deals] A network error occurred when calling the live market API:", msg);
            return new Response(
                JSON.stringify({ error: "Could not connect to the live market data service.", details: msg, deals: [] }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } } // 502 Bad Gateway is appropriate here
            );
        }

        let props: any[] = data.props || [];

        // Apply optional server-side filters
        if (max_price) props = props.filter((p) => !p.price || p.price <= max_price);
        if (min_beds) props = props.filter((p) => !p.bedrooms || p.bedrooms >= min_beds);
        if (max_dom) props = props.filter((p) => !p.daysOnZillow || p.daysOnZillow <= max_dom);

        // Map the properties to our standardized "deal" format.
        const deals = props.map((prop: any) => ({
            address: prop.address || "Address unavailable",
            url: `https://www.zillow.com/homedetails/${prop.zpid}_zpid/`,
            list_price: prop.price ? `$${prop.price.toLocaleString()}` : "N/A",
            dom: prop.daysOnZillow ?? null,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            sqft: prop.livingArea,
            price_raw: prop.price, // Keep the raw price for calculations
        }));

        return new Response(JSON.stringify(deals), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[live-market-deals] An unexpected error occurred in the function:", msg);
        return new Response(
            JSON.stringify({ error: "An unexpected server error occurred.", details: msg, deals: [] }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
