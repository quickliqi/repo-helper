import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, status, admin_notes }: VerificationEmailRequest = await req.json();

    console.log("Sending verification email for user:", user_id, "status:", status);

    // Create Supabase client to get user details
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
    
    if (authError || !authUser?.user?.email) {
      console.error("Error getting user email:", authError);
      return new Response(
        JSON.stringify({ error: "Could not find user email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = authUser.user.email;

    // Get user's profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .maybeSingle();

    const userName = profile?.full_name || "there";

    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = "🎉 Your DealMatch Identity Verification is Approved!";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✓ Verification Approved</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${userName},</p>
            <p>Great news! Your identity verification has been <strong style="color: #059669;">approved</strong>.</p>
            <p>You now have full access to all DealMatch features:</p>
            <ul style="background: white; padding: 20px 20px 20px 40px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <li style="margin-bottom: 8px;">Post deals and connect with investors</li>
              <li style="margin-bottom: 8px;">Contact sellers directly</li>
              <li style="margin-bottom: 8px;">Verified badge on your profile</li>
              <li>Full platform access</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://your-app-url.lovable.app/dashboard" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
              Thank you for being part of the DealMatch community!
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "DealMatch Identity Verification Update";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Verification Update Required</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 18px; margin-top: 0;">Hi ${userName},</p>
            <p>We were unable to verify your identity with the documents provided.</p>
            ${admin_notes ? `
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <strong style="color: #92400e;">Reason:</strong>
                <p style="margin: 8px 0 0 0; color: #78350f;">${admin_notes}</p>
              </div>
            ` : ''}
            <p>Please submit a new verification request with:</p>
            <ul style="background: white; padding: 20px 20px 20px 40px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <li style="margin-bottom: 8px;">A clear, unobstructed photo of your government-issued ID</li>
              <li style="margin-bottom: 8px;">Ensure all text is readable and not blurry</li>
              <li>Make sure the ID is not expired</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://your-app-url.lovable.app/verify" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Submit New Verification</a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
              If you have questions, please contact our support team.
            </p>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "DealMatch <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
