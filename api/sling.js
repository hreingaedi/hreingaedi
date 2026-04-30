async function slingLogin() {
  const res = await fetch('https://api.getsling.com/v1/account/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SLING_EMAIL,
      password: process.env.SLING_PASSWORD,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sling login failed (${res.status}): ${text}`);
  }

  const token =
    res.headers.get('authorization') ||
    (await res.json().then(j => j.token || j.data?.token || null).catch(() => null));

  if (!token) throw new Error('Sling login succeeded but no token found in response');
  return token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action;
  if (action !== 'create' && action !== 'cancel') {
    return res.status(400).json({ error: 'Unknown action' });
  }

  try {
    const token = await slingLogin();
    const orgId = process.env.SLING_ORG_ID;

    if (action === 'create') {
      const { date, startTime, endTime, slingUserId } = req.body;
      if (!date || !startTime || !endTime || !slingUserId) {
        return res.status(400).json({ error: 'Missing required fields: date, startTime, endTime, slingUserId' });
      }

      const shiftRes = await fetch(`https://api.getsling.com/v1/${orgId}/shifts`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dtstart: `${date}T${startTime}`,
          dtend: `${date}T${endTime}`,
          location: { id: Number(process.env.SLING_LOCATION_ID) },
          position: { id: Number(process.env.SLING_POSITION_ID) },
          slots: 1,
          status: 'published',
          taskTemplates: [],
          users: [{ id: slingUserId }],
        }),
      });

      if (!shiftRes.ok) {
        const text = await shiftRes.text();
        throw new Error(`Sling create shift failed (${shiftRes.status}): ${text}`);
      }

      const json = await shiftRes.json();
      const shiftId = Array.isArray(json) ? json[0]?.id : json?.id;
      return res.status(200).json({ success: true, shift_id: shiftId });
    }

    if (action === 'cancel') {
      const { shiftId } = req.body;
      if (!shiftId) return res.status(400).json({ error: 'Missing required field: shiftId' });

      const cancelRes = await fetch(`https://api.getsling.com/v1/${orgId}/shifts/delete`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ id: shiftId }]),
      });

      if (!cancelRes.ok) {
        const text = await cancelRes.text();
        throw new Error(`Sling cancel shift failed (${cancelRes.status}): ${text}`);
      }

      return res.status(200).json({ success: true });
    }

  } catch (err) {
    console.error('Sling error:', err);
    return res.status(500).json({ error: 'Sling integration failed', details: err.message });
  }
}
