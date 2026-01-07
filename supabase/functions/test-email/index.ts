import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[TEST-EMAIL] ${step}`, details ? JSON.stringify(details) : "");
};

interface TestEmailRequest {
  type: "welcome" | "verification_approved" | "verification_rejected" | "match" | "message" | "purchase";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Received test email request");

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user and check if admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logStep("Auth error", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      logStep("Non-admin user attempted test", { userId: user.id });
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type }: TestEmailRequest = await req.json();
    logStep("Testing email type", { type, userEmail: user.email });

    const siteUrl = Deno.env.get("SITE_URL") || "https://dealflow.app";

    let subject: string;
    let html: string;

    switch (type) {
      case "welcome":
        subject = "🧪 TEST: Welcome to DealMatch!";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h1 style="color: #1a365d;">Welcome to DealMatch!</h1>
            <p>This is a test of the welcome email that new users receive when they sign up.</p>
            <a href="${siteUrl}/dashboard" style="display: inline-block; background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
          </div>
        `;
        break;

      case "verification_approved":
        subject = "🧪 TEST: Verification Approved";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h1>✓ Verification Approved</h1>
            </div>
            <p style="margin-top: 20px;">This is a test of the email sent when a user's identity verification is approved.</p>
          </div>
        `;
        break;

      case "verification_rejected":
        subject = "🧪 TEST: Verification Update Required";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h1>Verification Update Required</h1>
            </div>
            <p style="margin-top: 20px;">This is a test of the email sent when a user's identity verification is rejected.</p>
          </div>
        `;
        break;

      case "match":
        subject = "🧪 TEST: New Property Match!";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h1 style="color: #1a365d;">🏠 New Property Match!</h1>
            <p>This is a test of the email sent when a property matches an investor's buy box criteria.</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>Sample Property</h2>
              <p>123 Main Street, Phoenix, AZ</p>
              <p style="color: #d69e2e; font-weight: bold;">Match Score: 85%</p>
            </div>
          </div>
        `;
        break;

      case "message":
        subject = "🧪 TEST: New Message!";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <h1 style="color: #1a365d;">💬 New Message!</h1>
            <p>This is a test of the email sent when a user receives a new message about a property.</p>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> Test User</p>
              <p><strong>Property:</strong> Sample Property</p>
              <p><strong>Message:</strong> "This is a sample message preview..."</p>
            </div>
          </div>
        `;
        break;

      case "purchase":
        subject = "🧪 TEST: Purchase Confirmation";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>⚠️ This is a test email</strong>
            </div>
            <div style="background: #059669; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h1>Purchase Confirmed!</h1>
            </div>
            <p style="margin-top: 20px;">This is a test of the purchase confirmation email.</p>
            <div style="text-align: center; font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0;">
              $29.00
            </div>
          </div>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "DealMatch <onboarding@resend.dev>",
      to: [user.email!],
      subject,
      html,
    });

    logStep("Test email sent successfully", { response: emailResponse });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test ${type} email sent to ${user.email}`,
        data: emailResponse 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    logStep("Error sending test email", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
