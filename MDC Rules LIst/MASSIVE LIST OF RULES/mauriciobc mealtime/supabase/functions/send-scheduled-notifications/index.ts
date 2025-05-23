import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Debug: log all environment variables
  const envVars = Object.fromEntries(Deno.env.toObject ? Object.entries(Deno.env.toObject()) : []);
  console.log('[Edge Debug] Environment Variables:', envVars);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://zzvmyzyszsqptgyqwqwt.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. All envs:', envVars);
    return new Response(JSON.stringify({ error: 'Service role key not set', envVars }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Query for scheduled notifications to deliver
    const { data: notifications, error } = await supabase
      .from('scheduledNotification')
      .select('*')
      .eq('delivered', false)
      .lte('deliverAt', new Date().toISOString());

    if (error) throw error;
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ success: true, notificationsSent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Deliver and insert notifications
    let deliveredCount = 0;
    for (const notification of notifications) {
      try {
        // Insert into notifications table
        const { error: insertError } = await supabase
          .from('notifications')
          .insert([{
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined,
            user_id: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            metadata: notification.metadata ?? {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        if (insertError) {
          console.error(`[Edge] Failed to insert notification for user ${notification.userId}:`, insertError);
          continue; // Skip marking as delivered
        }

        // Mark as delivered
        const { error: updateError } = await supabase
          .from('scheduledNotification')
          .update({ delivered: true, deliveredAt: new Date().toISOString() })
          .eq('id', notification.id);
        if (updateError) {
          console.error(`[Edge] Failed to mark scheduledNotification as delivered:`, updateError);
          continue;
        }

        deliveredCount++;
        console.log(`[Edge] Delivered and recorded notification for user ${notification.userId}`);
      } catch (err) {
        console.error(`[Edge] Exception delivering notification for user ${notification.userId}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, notificationsSent: deliveredCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Edge Function Error]', error);
    return new Response(JSON.stringify({ error: error.message ?? String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 