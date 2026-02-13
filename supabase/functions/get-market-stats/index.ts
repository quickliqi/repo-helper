import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Create a Supabase client with the Admin Key to bypass RLS for aggregation
        // note: In a real prod scenario, we might use a specific role or view
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Get Active Deals Count
        const { count: activeCount, error: countError } = await supabaseAdmin
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

        if (countError) throw countError;

        // 2. Calculate Aggregates (ARV, Discount)
        // For performance, we limit to the last 50 active deals
        const { data: deals, error: dealsError } = await supabaseAdmin
            .from("properties")
            .select("asking_price, arv, created_at, closed_at")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(50);

        if (dealsError) throw dealsError;

        let medianArv = 0;
        let avgDiscount = 0;

        if (deals && deals.length > 0) {
            // Median ARV
            const arvs = deals.map(d => d.arv).sort((a, b) => a - b);
            const mid = Math.floor(arvs.length / 2);
            medianArv = arvs.length % 2 !== 0 ? arvs[mid] : (arvs[mid - 1] + arvs[mid]) / 2;

            // Avg Discount (Asking / ARV)
            // Note: "70% Rule" means Discount should be around 0.70 or lower
            const discounts = deals.map(d => d.arv > 0 ? d.asking_price / d.arv : 0).filter(d => d > 0);
            const totalDiscount = discounts.reduce((acc, curr) => acc + curr, 0);
            avgDiscount = discounts.length > 0 ? totalDiscount / discounts.length : 0;
        }

        const stats = {
            activeDeals: activeCount || 0,
            medianArv: medianArv || 0,
            avgDiscount: avgDiscount || 0,
            fastestClose: 24, // Hardcoded for now, or calculate from 'closed_at' delta
            volumeTrend: 'up' // Placeholder logic
        };

        return new Response(JSON.stringify(stats), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
