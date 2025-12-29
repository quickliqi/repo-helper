import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  type: "match" | "deal_view" | "deal_contact";
  recipientEmail: string;
  recipientName: string;
  propertyTitle?: string;
  propertyCity?: string;
  propertyState?: string;
  viewerName?: string;
  matchScore?: number;
}

const getEmailContent = (data: NotificationEmailRequest) => {
  switch (data.type) {
    case "match":
      return {
        subject: `🏠 New Property Match! ${data.matchScore}% Match Score`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a365d; font-size: 24px; margin-bottom: 20px;">New Property Match!</h1>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi ${data.recipientName},</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              Great news! A new property matching your criteria has been listed on DealFlow.
            </p>
            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2d3748; font-size: 18px; margin: 0 0 10px 0;">${data.propertyTitle}</h2>
              <p style="color: #718096; margin: 0;">${data.propertyCity}, ${data.propertyState}</p>
              <p style="color: #d69e2e; font-weight: 600; margin: 10px 0 0 0;">Match Score: ${data.matchScore}%</p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://dealflow.app"}/marketplace" 
               style="display: inline-block; background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Property
            </a>
          </div>
        `,
      };
    case "deal_view":
      return {
        subject: `👀 Someone Viewed Your Deal: ${data.propertyTitle}`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a365d; font-size: 24px; margin-bottom: 20px;">Your Deal Got Attention!</h1>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi ${data.recipientName},</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              ${data.viewerName} just viewed your property listing.
            </p>
            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2d3748; font-size: 18px; margin: 0 0 10px 0;">${data.propertyTitle}</h2>
              <p style="color: #718096; margin: 0;">${data.propertyCity}, ${data.propertyState}</p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://dealflow.app"}/dashboard" 
               style="display: inline-block; background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Dashboard
            </a>
          </div>
        `,
      };
    case "deal_contact":
      return {
        subject: `📞 New Contact Request: ${data.propertyTitle}`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a365d; font-size: 24px; margin-bottom: 20px;">Someone Wants to Connect!</h1>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi ${data.recipientName},</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              ${data.viewerName} is interested in your property and wants to connect with you.
            </p>
            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #2d3748; font-size: 18px; margin: 0 0 10px 0;">${data.propertyTitle}</h2>
              <p style="color: #718096; margin: 0;">${data.propertyCity}, ${data.propertyState}</p>
            </div>
            <a href="${Deno.env.get("SITE_URL") || "https://dealflow.app"}/dashboard" 
               style="display: inline-block; background: #d69e2e; color: #1a365d; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Respond Now
            </a>
          </div>
        `,
      };
    default:
      return { subject: "DealFlow Notification", html: "<p>You have a new notification.</p>" };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationEmailRequest = await req.json();
    console.log("[SEND-NOTIFICATION-EMAIL] Received request:", data);

    const emailContent = getEmailContent(data);

    const emailResponse = await resend.emails.send({
      from: "DealFlow <notifications@resend.dev>",
      to: [data.recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("[SEND-NOTIFICATION-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[SEND-NOTIFICATION-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
