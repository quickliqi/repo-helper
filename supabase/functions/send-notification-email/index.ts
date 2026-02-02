import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

interface NotificationEmailRequest {
  type: "match" | "deal_view" | "deal_contact" | "new_message";
  recipientEmail: string;
  recipientName: string;
  propertyTitle?: string;
  propertyCity?: string;
  propertyState?: string;
  viewerName?: string;
  viewerEmail?: string;
  viewerPhone?: string;
  message?: string;
  matchScore?: number;
}

const getEmailContent = (data: NotificationEmailRequest) => {
  const siteUrl = "https://quickliqi.lovable.app";
  
  switch (data.type) {
    case "match":
      return {
        subject: `🏠 New Property Match! ${data.matchScore}% Match Score`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">QuickLiqi</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #10b981; font-size: 24px; margin-top: 0;">New Property Match!</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi ${data.recipientName},</p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Great news! A new property matching your criteria has been listed on QuickLiqi.
              </p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #2d3748; font-size: 18px; margin: 0 0 10px 0;">${data.propertyTitle}</h3>
                <p style="color: #718096; margin: 0;">${data.propertyCity}, ${data.propertyState}</p>
                <p style="color: #10b981; font-weight: 600; margin: 10px 0 0 0;">Match Score: ${data.matchScore}%</p>
              </div>
              <a href="${siteUrl}/marketplace" 
                 style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View Property
              </a>
            </div>
          </div>
        `,
      };
    case "deal_view":
      return {
        subject: `👀 Someone Viewed Your Deal: ${data.propertyTitle}`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">QuickLiqi</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #10b981; font-size: 24px; margin-top: 0;">Your Deal Got Attention!</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi ${data.recipientName},</p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                ${data.viewerName} just viewed your property listing.
              </p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #2d3748; font-size: 18px; margin: 0 0 10px 0;">${data.propertyTitle}</h3>
                <p style="color: #718096; margin: 0;">${data.propertyCity}, ${data.propertyState}</p>
              </div>
              <a href="${siteUrl}/dashboard" 
                 style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View Dashboard
              </a>
            </div>
          </div>
        `,
      };
    case "deal_contact":
    case "new_message":
      return {
        subject: `💬 New Message: ${data.propertyTitle}`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">QuickLiqi</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #10b981; font-size: 24px; margin-top: 0;">New Message!</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hi ${data.recipientName},</p>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                <strong>${data.viewerName}</strong> sent you a message about your property.
              </p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h4 style="color: #2d3748; font-size: 16px; margin: 0 0 10px 0;">Property:</h4>
                <p style="color: #2d3748; font-size: 18px; font-weight: 600; margin: 0 0 5px 0;">${data.propertyTitle}</p>
                <p style="color: #718096; margin: 0;">${data.propertyCity}, ${data.propertyState}</p>
              </div>
              
              ${data.message ? `
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #2d3748; font-size: 16px; margin: 0 0 10px 0;">Message Preview:</h4>
                <p style="color: #4a5568; font-style: italic; margin: 0;">"${data.message.substring(0, 200)}${data.message.length > 200 ? '...' : ''}"</p>
              </div>
              ` : ''}
              
              <p style="color: #4a5568; font-size: 14px; margin-bottom: 20px;">
                Reply to this message securely through our platform.
              </p>
              
              <a href="${siteUrl}/messages" 
                 style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View Conversation
              </a>
              
              <p style="color: #718096; font-size: 12px; margin-top: 20px;">
                For your security, all communication happens through our secure messaging platform.
              </p>
            </div>
          </div>
        `,
      };
    default:
      return { subject: "QuickLiqi Notification", html: "<p>You have a new notification.</p>" };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SEND-NOTIFICATION-EMAIL] Received request");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[SEND-NOTIFICATION-EMAIL] No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let userId = "service_role";

    if (token !== serviceRoleKey) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      });

      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        console.error("[SEND-NOTIFICATION-EMAIL] Invalid authorization:", authError?.message);
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      userId = userData.user.id;
      console.log("[SEND-NOTIFICATION-EMAIL] Request authorized for user:", userId);
    } else {
      console.log("[SEND-NOTIFICATION-EMAIL] Request authorized via service role key");
    }

    const clientIP = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     userId;
    
    if (!checkRateLimit(clientIP)) {
      console.error("[SEND-NOTIFICATION-EMAIL] Rate limit exceeded for:", clientIP);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: NotificationEmailRequest = await req.json();
    console.log("[SEND-NOTIFICATION-EMAIL] Email type:", data.type, "To:", data.recipientEmail);

    let recipientEmail = data.recipientEmail;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(recipientEmail)) {
      console.log("[SEND-NOTIFICATION-EMAIL] Resolving user_id to email:", recipientEmail);
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(recipientEmail);
      
      if (authError || !authUser?.user?.email) {
        console.error("[SEND-NOTIFICATION-EMAIL] Could not resolve user email:", authError?.message);
        return new Response(
          JSON.stringify({ error: "Could not find recipient email" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      recipientEmail = authUser.user.email;
      console.log("[SEND-NOTIFICATION-EMAIL] Resolved to email:", recipientEmail);
    }

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!data.recipientName || data.recipientName.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient name" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = getEmailContent(data);

    const emailResponse = await resend.emails.send({
      from: "QuickLiqi <noreply@send.quickliqi.com>",
      to: [recipientEmail],
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
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
