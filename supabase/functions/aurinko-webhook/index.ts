import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("AURINKO_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase configuration", { status: 500 });
  }

  if (webhookSecret) {
    const signature = req.headers.get("x-aurinko-signature");
    if (signature !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const payload = await req.json();
  const userId = payload?.user_id;
  const workEmail = payload?.work_email;

  if (!userId || !workEmail) {
    return new Response("Invalid payload", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase
    .from("aurinko_work_mails")
    .insert({ user_id: userId, work_email: workEmail });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
