/* Hrein Gæði — public health check.
   Óvarið viljandi (enginn CRON_SECRET): utanaðkomandi vöktun (UptimeRobot o.fl.)
   getur ekki sent auth-hausa. Skilar 200 þegar gagnagrunnurinn svarar, 503 annars,
   svo vöktunin sendi email um leið og Supabase fer í pásu.
   Tvöfalt hlutverk: þetta telst líka virkni og heldur verkefninu vakandi.
   Skilar ENGUM gögnum — bara stöðu. */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const started = Date.now();
  try {
    const { error } = await supabase
      .from('users_meta')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Health check: database error:', error.message);
      return res.status(503).json({ ok: false, database: 'error', ms: Date.now() - started });
    }

    return res.status(200).json({
      ok: true,
      database: 'up',
      ms: Date.now() - started,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check: unexpected error:', err.message);
    return res.status(503).json({ ok: false, database: 'unreachable', ms: Date.now() - started });
  }
}
