import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  role: "investor" | "wholesaler";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role }: WelcomeEmailRequest = await req.json();

    console.log("[SEND-WELCOME-EMAIL] Sending welcome email to:", email, "role:", role);

    const roleSpecificContent = role === "investor" 
      ? `
        <div class="feature">
          <span class="check">✓</span>
          <span>Create custom Buy Boxes to match your investment criteria</span>
        </div>
        <div class="feature">
          <span class="check">✓</span>
          <span>Get instant notifications when matching deals are posted</span>
        </div>
        <div class="feature">
          <span class="check">✓</span>
          <span>Connect directly with verified wholesalers</span>
        </div>
        <div class="feature">
          <span class="check">✓</span>
          <span>Browse the marketplace for off-market deals</span>
        </div>
      `
      : `
        <div class="feature">
          <span class="check">✓</span>
          <span>Post your deals to reach verified investors</span>
        </div>
        <div class="feature">
          <span class="check">✓</span>
          <span>Get matched with investors based on their Buy Box criteria</span>
        </div>
        <div class="feature">
          <span class="check">✓</span>
          <span>Receive contact requests from serious buyers</span>
        </div>
        <div class="feature">
          <span class="check">✓</span>
          <span>Track views and interest on your listings</span>
        </div>
      `;

    const nextStepText = role === "investor"
      ? "Start by completing your profile and verifying your identity to unlock full platform access."
      : "Start by completing your profile, verifying your identity, and posting your first deal.";

    const ctaButton = role === "investor"
      ? `<a href="https://quickliqi.lovable.app/profile-setup" class="button">Complete Your Profile</a>`
      : `<a href="https://quickliqi.lovable.app/profile-setup" class="button">Get Started</a>`;

    const html = `
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
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
          .greeting { font-size: 20px; margin-bottom: 20px; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .features h3 { margin-top: 0; color: #10b981; }
          .feature { padding: 12px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: flex-start; }
          .feature:last-child { border-bottom: none; }
          .check { color: #10b981; margin-right: 12px; font-weight: bold; }
          .next-step { background: #d1fae5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
          .next-step strong { color: #065f46; }
          .button { display: inline-block; background: #10b981; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .footer a { color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to QuickLiqi!</h1>
            <p>Your real estate investment journey starts here</p>
          </div>
          <div class="content">
            <p class="greeting">Hi ${name || 'there'},</p>
            <p>Thank you for joining QuickLiqi! We're excited to have you as part of our community of ${role === 'investor' ? 'real estate investors' : 'wholesalers'}.</p>
            
            <div class="features">
              <h3>What you can do on QuickLiqi:</h3>
              ${roleSpecificContent}
            </div>
            
            <div class="next-step">
              <strong>Next Step:</strong>
              <p style="margin: 8px 0 0 0;">${nextStepText}</p>
            </div>
            
            <p style="text-align: center;">
              ${ctaButton}
            </p>
            
            <div class="footer">
              <p>Questions? Just reply to this email - we're here to help!</p>
              <p>— The QuickLiqi Team</p>
              <p style="margin-top: 20px; font-size: 12px;">
                <a href="https://quickliqi.lovable.app/terms">Terms of Service</a> · 
                <a href="https://quickliqi.lovable.app/privacy">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "QuickLiqi <noreply@send.quickliqi.com>",
      to: [email],
      subject: `Welcome to QuickLiqi, ${name || 'there'}! 🎉`,
      html,
    });

    console.log("[SEND-WELCOME-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[SEND-WELCOME-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
