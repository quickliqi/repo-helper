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

        // Stage 1.1: Graceful key check — never crash, return [] with a clear signal
        const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
        if (!RAPIDAPI_KEY) {
            console.warn("[live-market-deals] RAPIDAPI_KEY not set.");
            return new Response(
                JSON.stringify({ error: "RAPIDAPI_KEY missing", deals: [] }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const encodedLocation = encodeURIComponent(location || "");
        const apiUrl = `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?location=${encodedLocation}&status_type=ForSale`;

        let data: any;
        try {
            const apiRes = await fetch(apiUrl, {
                headers: {
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
                },
            });

            // Explicit non-ok response
            if (!apiRes.ok) {
                const errorText = await apiRes.text();
                console.error("[live-market-deals] RapidAPI returned non-200:", apiRes.status, errorText);
                return new Response(
                    JSON.stringify({ error: "RapidAPI Error", status: apiRes.status, details: errorText, deals: [] }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            data = await apiRes.json();
        } catch (fetchErr) {
            const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
            console.error("[live-market-deals] Network or parsing error calling RapidAPI:", msg);
            return new Response(
                JSON.stringify({ error: "Network or parsing error calling RapidAPI", details: msg, deals: [] }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        let props: any[] = data.props || [];

        // Apply optional filters
        if (max_price) props = props.filter((p) => !p.price || p.price <= max_price);
        if (min_beds) props = props.filter((p) => !p.bedrooms || p.bedrooms >= min_beds);
        if (max_dom) props = props.filter((p) => !p.daysOnZillow || p.daysOnZillow <= max_dom);

        // Return raw property data — NO Regrid enrichment here.
        // Regrid calls are made post-filter in ai-hunter for top N deals only.
        const deals = props.map((prop: any) => ({
            address: prop.address || "Address unavailable",
            url: `https://www.zillow.com/homedetails/${prop.zpid}_zpid/`,
            list_price: prop.price ? `$${prop.price.toLocaleString()}` : "N/A",
            dom: prop.daysOnZillow ?? null,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            sqft: prop.livingArea,
            price_raw: prop.price,
        }));

        return new Response(JSON.stringify(deals), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[live-market-deals] Unexpected error:", msg);
        return new Response(
            JSON.stringify({ error: "Unexpected server error", details: msg, deals: [] }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
