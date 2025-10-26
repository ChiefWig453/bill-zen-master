import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the current user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify the user is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error("Only admins can invite users");
    }

    const { email, firstName, lastName, role }: InviteUserRequest = await req.json();

    // Validate input
    if (!email || !firstName || !lastName || !role) {
      throw new Error("Missing required fields");
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("email", email.trim())
      .single();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Create user and generate password reset link (sends email automatically)
    const { data: inviteData, error: createError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email.trim(),
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });

    if (createError) {
      throw createError;
    }

    if (!inviteData.user) {
      throw new Error("Failed to create user");
    }

    // Update profile with invitation info
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .eq("id", inviteData.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    // Update role if admin
    if (role === 'admin') {
      const { error: roleUpdateError } = await supabaseAdmin
        .from("user_roles")
        .update({ role: 'admin' })
        .eq("user_id", inviteData.user.id);

      if (roleUpdateError) {
        console.error("Error updating role:", roleUpdateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${email} has been invited and will receive an email to set their password.` 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
