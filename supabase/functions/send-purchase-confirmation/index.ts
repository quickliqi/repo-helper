import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-PURCHASE-CONFIRMATION] ${step}`, details ? JSON.stringify(details) : "");
};

interface PurchaseEmailRequest {
  email: string;
  type: "subscription" | "credits";
  amount: number;
  quantity?: number;
  planName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, amount, quantity, planName }: PurchaseEmailRequest = await req.json();
    
    logStep("Sending confirmation email", { email, type, amount });

    const siteUrl = "https://quickliqi.lovable.app";
    let subject: string;
    let html: string;

    if (type === "subscription") {
      subject = "Welcome to QuickLiqi Pro! 🎉";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; }
            .feature:last-child { border-bottom: none; }
            .check { color: #10b981; margin-right: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to QuickLiqi Pro!</h1>
            </div>
            <div class="content">
              <p>Thank you for subscribing to <strong>${planName || 'Investor Pro'}</strong>!</p>
              <div class="amount">$${(amount / 100).toFixed(2)}/month</div>
              
              <div class="features">
                <h3>What's included:</h3>
                <div class="feature">
                  <span class="check">✓</span>
                  <span>Unlimited property matches</span>
                </div>
                <div class="feature">
                  <span class="check">✓</span>
                  <span>Advanced buy box criteria</span>
                </div>
                <div class="feature">
                  <span class="check">✓</span>
                  <span>Real-time notifications</span>
                </div>
                <div class="feature">
                  <span class="check">✓</span>
                  <span>Direct wholesaler contact</span>
                </div>
                <div class="feature">
                  <span class="check">✓</span>
                  <span>Priority support</span>
                </div>
              </div>
              
              <p style="text-align: center;">
                <a href="${siteUrl}/dashboard" class="button">Go to Dashboard</a>
              </p>
              
              <div class="footer">
                <p>If you have any questions, reply to this email and we'll be happy to help.</p>
                <p>— The QuickLiqi Team</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = `Your Listing Credits Are Ready! 📦`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .credits-box { background: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #e5e7eb; }
            .credits-number { font-size: 48px; font-weight: bold; color: #10b981; }
            .credits-label { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .amount { font-size: 18px; color: #374151; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Listing Credits Purchased!</h1>
            </div>
            <div class="content">
              <p>Thank you for your purchase! Your listing credits have been added to your account.</p>
              
              <div class="credits-box">
                <div class="credits-number">${quantity || 1}</div>
                <div class="credits-label">Listing Credit${(quantity || 1) > 1 ? 's' : ''}</div>
                <div class="amount">Total: $${(amount / 100).toFixed(2)}</div>
              </div>
              
              <p>Each credit allows you to post one property listing to the QuickLiqi marketplace, where investors actively search for deals.</p>
              
              <p style="text-align: center;">
                <a href="${siteUrl}/post-deal" class="button">Post a Deal Now</a>
              </p>
              
              <div class="footer">
                <p>Credits never expire. Use them whenever you're ready!</p>
                <p>— The QuickLiqi Team</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "QuickLiqi <noreply@send.quickliqi.com>",
      to: [email],
      subject,
      html,
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
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
