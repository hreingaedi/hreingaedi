/* Hrein Gæði — server-side web-push helper.
   Underscore prefix = not exposed as a Vercel endpoint; imported by api/notify.js.
   Uses the service-role key (server-only — see LOAD-BEARING.md) to read
   users_meta and push_subscriptions.
   Every export swallows its own errors: push must NEVER break email delivery.
   If VAPID env vars are missing, everything no-ops (deploy-safe before setup). */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

let configured = false;

function ensureConfig() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hreingaedi@hreingaedi.is', pub, priv);
  configured = true;
  return true;
}

function db() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function sendTo(client, rows, payload) {
  const body = JSON.stringify(payload);
  await Promise.allSettled(rows.map(async (r) => {
    try {
      await webpush.sendNotification(r.subscription, body);
    } catch (e) {
      // 404/410 = subscription expired or revoked — clean it up
      if (e.statusCode === 404 || e.statusCode === 410) {
        await client.from('push_subscriptions').delete().eq('endpoint', r.endpoint);
      }
    }
  }));
}

/* Push to every user with one of the given roles (e.g. ['admin','manager']). */
export async function pushToRoles(roles, payload) {
  try {
    if (!ensureConfig()) return;
    const client = db();
    const { data: users } = await client.from('users_meta').select('id').in('role', roles);
    if (!users || users.length === 0) return;
    const { data: subs } = await client
      .from('push_subscriptions').select('endpoint,subscription')
      .in('user_id', users.map((u) => u.id));
    if (subs && subs.length > 0) await sendTo(client, subs, payload);
  } catch (e) {
    console.error('pushToRoles failed:', e);
  }
}

/* Push to a single user by users_meta id (uuid). No-ops on missing/'general'. */
export async function pushToUser(userId, payload) {
  try {
    if (!ensureConfig() || !userId || userId === 'general') return;
    const client = db();
    const { data: subs } = await client
      .from('push_subscriptions').select('endpoint,subscription')
      .eq('user_id', userId);
    if (subs && subs.length > 0) await sendTo(client, subs, payload);
  } catch (e) {
    console.error('pushToUser failed:', e);
  }
}
