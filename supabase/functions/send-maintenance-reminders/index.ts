import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceTask {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  next_due_date: string;
  reminder_days_before: number;
  frequency: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting maintenance reminders check...");

    // Get all users with home maintenance enabled
    const { data: preferences, error: prefsError } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("home_maintenance_enabled", true);

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      console.log("No users with home maintenance enabled");
      return new Response(
        JSON.stringify({ message: "No users with home maintenance enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userIds = preferences.map(p => p.user_id);
    console.log(`Found ${userIds.length} users with home maintenance enabled`);

    // Get tasks that are due soon for these users
    const today = new Date();
    const { data: tasks, error: tasksError } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .in("user_id", userIds)
      .eq("is_active", true)
      .not("next_due_date", "is", null);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw tasksError;
    }

    if (!tasks || tasks.length === 0) {
      console.log("No active tasks found");
      return new Response(
        JSON.stringify({ message: "No active tasks found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter tasks that need reminders
    const tasksDue = tasks.filter((task: MaintenanceTask) => {
      const dueDate = new Date(task.next_due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - task.reminder_days_before);
      
      // Check if today is the reminder date
      return reminderDate.toDateString() === today.toDateString();
    });

    console.log(`Found ${tasksDue.length} tasks needing reminders`);

    if (tasksDue.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks due for reminders today" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Group tasks by user
    const tasksByUser = tasksDue.reduce((acc: Record<string, MaintenanceTask[]>, task) => {
      if (!acc[task.user_id]) {
        acc[task.user_id] = [];
      }
      acc[task.user_id].push(task);
      return acc;
    }, {});

    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .in("id", Object.keys(tasksByUser));

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Send emails
    let emailsSent = 0;
    for (const profile of profiles as UserProfile[]) {
      const userTasks = tasksByUser[profile.id];
      
      const taskListHtml = userTasks
        .map(task => {
          const dueDate = new Date(task.next_due_date);
          return `
            <li style="margin-bottom: 12px;">
              <strong>${task.name}</strong><br/>
              ${task.description || ""}<br/>
              <span style="color: #666;">Due: ${dueDate.toLocaleDateString()}</span>
            </li>
          `;
        })
        .join("");

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🏠 Home Maintenance Reminder</h2>
          <p>Hi ${profile.first_name || "there"},</p>
          <p>You have ${userTasks.length} maintenance task${userTasks.length > 1 ? "s" : ""} coming up:</p>
          <ul style="list-style: none; padding: 0;">
            ${taskListHtml}
          </ul>
          <p style="margin-top: 24px;">
            <a href="${supabaseUrl.replace("https://", "https://rzzxfufbiziokdhaokcn.")}/maintenance" 
               style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Tasks
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 32px;">
            You're receiving this because you have home maintenance reminders enabled. 
            You can disable these in your settings.
          </p>
        </div>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Home Maintenance <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🏠 ${userTasks.length} Home Maintenance Task${userTasks.length > 1 ? "s" : ""} Due Soon`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send email to ${profile.email}:`, emailError);
        } else {
          console.log(`Email sent successfully to ${profile.email}`);
          emailsSent++;
        }
      } catch (error) {
        console.error(`Error sending email to ${profile.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${emailsSent} reminder email${emailsSent !== 1 ? "s" : ""}`,
        tasksChecked: tasks.length,
        remindersSent: emailsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-maintenance-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
