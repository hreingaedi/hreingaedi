import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { error } = await supabase
      .from('users_meta')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Keep-alive query failed:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase pinged successfully'
    });
  } catch (err) {
    console.error('Keep-alive error:', err);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}
