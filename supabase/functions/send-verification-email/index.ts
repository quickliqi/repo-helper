import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  user_id: string;
  status: "approved" | "rejected";
  admin_notes?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-VERIFICATION-EMAIL] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, status, admin_notes }: VerificationEmailRequest = await req.json();

    logStep("Processing verification email", { user_id, status });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);

    if (userError || !userData.user?.email) {
      logStep("Failed to get user email", { error: userError?.message });
      throw new Error("Could not find user email");
    }

    const userEmail = userData.user.email;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .single();

    const userName = profile?.full_name || "there";
    const siteUrl = "https://quickliqi.com";

    logStep("Sending to user", { email: userEmail, name: userName });

    const isApproved = status === "approved";
    const subject = isApproved
      ? "✅ Your QuickLiqi Account is Now Verified!"
      : "⚠️ Verification Update - QuickLiqi";

    const approvedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
          .success-icon { text-align: center; margin-bottom: 20px; }
          .success-icon span { display: inline-block; background: #d1fae5; border-radius: 50%; padding: 20px; font-size: 32px; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .features h3 { margin-top: 0; color: #10b981; }
          .feature { padding: 10px 0; display: flex; align-items: center; gap: 10px; }
          .check { color: #10b981; font-weight: bold; }
          .button { display: inline-block; background: #10b981; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .footer a { color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Verified! 🎉</h1>
          </div>
          <div class="content">
            <div class="success-icon">
              <span>✓</span>
            </div>
            <p>Hi ${userName},</p>
            <p>Great news! Your identity has been verified and you now have <strong>full access</strong> to all QuickLiqi features.</p>
            
            <div class="features">
              <h3>What you can do now:</h3>
              <div class="feature">
                <span class="check">✓</span>
                <span>View complete property details and contact information</span>
              </div>
              <div class="feature">
                <span class="check">✓</span>
                <span>Message investors and wholesalers directly</span>
              </div>
              <div class="feature">
                <span class="check">✓</span>
                <span>Post deals and receive match notifications</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${siteUrl}/dashboard" class="button">Go to Dashboard</a>
            </p>
            
            <div class="footer">
              <p>Ready to close your next deal? Start browsing properties now!</p>
              <p>— The QuickLiqi Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const rejectedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
          .alert { background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .tips { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .tips h3 { margin-top: 0; color: #10b981; }
          .tip { padding: 8px 0; display: flex; align-items: flex-start; gap: 10px; }
          .tip-number { background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
          .button { display: inline-block; background: #10b981; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verification Update</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We were unable to verify your identity with the documents you provided.</p>
            
            ${admin_notes ? `
            <div class="alert">
              <strong>Reason:</strong> ${admin_notes}
            </div>
            ` : ""}
            
            <div class="tips">
              <h3>Tips for successful verification:</h3>
              <div class="tip">
                <span class="tip-number">1</span>
                <span>Ensure your ID is valid and not expired</span>
              </div>
              <div class="tip">
                <span class="tip-number">2</span>
                <span>Take photos in good lighting with no glare</span>
              </div>
              <div class="tip">
                <span class="tip-number">3</span>
                <span>Make sure all text on your ID is clearly readable</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${siteUrl}/verify" class="button">Try Again</a>
            </p>
            
            <div class="footer">
              <p>Need help? Just reply to this email and we'll assist you.</p>
              <p>— The QuickLiqi Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "QuickLiqi <noreply@send.quickliqi.com>",
      to: [userEmail],
      subject,
      html: isApproved ? approvedHtml : rejectedHtml,
    });

    logStep("Email sent successfully", { response: emailResponse });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
