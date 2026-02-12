import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (!user) throw new Error("Unauthorized");

        const { propertyId, investorName, wholesalerName, propertyAddress } = await req.json();

        if (!propertyId || !investorName || !wholesalerName || !propertyAddress) {
            throw new Error("Missing required parameters");
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Title
        page.drawText("JOINT VENTURE AGREEMENT", {
            x: 180,
            y: height - 50,
            size: 18,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        // Content
        const content = [
            `Date: ${new Date().toLocaleDateString()}`,
            `Property Address: ${propertyAddress}`,
            ``,
            `PARTIES:`,
            `This Joint Venture Agreement ("Agreement") is entered into by and between:`,
            `Wholesaler: ${wholesalerName}`,
            `Investor: ${investorName}`,
            `Platform Service: QuickLiqi`,
            ``,
            `1. PURPOSE: The parties agree to collaborate on the acquisition and/or`,
            `disposition of the property mentioned above.`,
            ``,
            `2. FEE SPLIT: The parties agree that upon successful closing of the transaction:`,
            `   - Wholesaler shall receive 90% of the net assignment/wholesale fee.`,
            `   - QuickLiqi shall receive 10% of the net assignment/wholesale fee as a platform matching fee.`,
            ``,
            `3. PLATFORM NEUTRALITY: QuickLiqi serves strictly as a matching platform and`,
            `data provider. QuickLiqi is not a real estate broker, legal representative,`,
            `or escrow agent. All transactions are at the parties' own risk.`,
            ``,
            `4. CONFIDENTIALITY: The Investor agrees not to circumvent the Wholesaler or`,
            `QuickLiqi by contacting the property owner directly or through other third`,
            `parties without the explicit written consent of the Wholesaler.`,
            ``,
            `5. E-SIGNATURE: By clicking "I Agree" on the QuickLiqi platform, both parties`,
            `accept the terms and conditions of this Agreement.`,
        ];

        let yOffset = height - 100;
        for (const line of content) {
            page.drawText(line, {
                x: 50,
                y: yOffset,
                size: 11,
                font: line.includes("PARTIES:") || line.match(/^\d\./) ? boldFont : font,
            });
            yOffset -= 20;
        }

        // Signatures placeholders
        yOffset -= 40;
        page.drawText("Electronically Signed by:", { x: 50, y: yOffset, size: 10, font: boldFont });
        yOffset -= 20;
        page.drawText(`Investor: ${investorName}`, { x: 50, y: yOffset, size: 10, font });
        page.drawText(`Date: ${new Date().toISOString()}`, { x: 350, y: yOffset, size: 10, font });

        const pdfBytes = await pdfDoc.save();

        return new Response(pdfBytes as unknown as BodyInit, {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="JV_Agreement_${propertyId}.pdf"`,
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
