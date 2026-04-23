import { google } from 'googleapis';

function getCalendarClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS);
  const impersonate = process.env.GOOGLE_IMPERSONATE_USER;
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    subject: impersonate,
  });
  return google.calendar({ version: 'v3', auth });
}

function parseBookingTime(timeString) {
  if (!timeString) return { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 };
  const rangeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
  if (rangeMatch) {
    return {
      startHour: parseInt(rangeMatch[1]),
      startMinute: parseInt(rangeMatch[2]),
      endHour: parseInt(rangeMatch[3]),
      endMinute: parseInt(rangeMatch[4]),
    };
  }
  const lower = timeString.toLowerCase();
  if (lower.includes('morg')) return { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 };
  if (lower.includes('eftir')) return { startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 };
  if (lower.includes('kvöld') || lower.includes('kvold')) return { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 };
  return { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 };
}

function buildEvent(data, status) {
  const { startHour, startMinute, endHour, endMinute } = parseBookingTime(data.time);
  const startDateTime = new Date(data.date);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  const endDateTime = new Date(data.date);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  const description = [
    `Þjónusta: ${data.service || ''}`,
    `Nafn: ${data.name || ''}`,
    `Sími: ${data.phone || ''}`,
    `Email: ${data.email || ''}`,
    data.size ? `Stærð: ${data.size}` : '',
    data.estimated_price ? `Verð: ${data.estimated_price} kr` : '',
    data.ref ? `Bókunarnúmer: ${data.ref}` : '',
    '',
    data.notes ? `Athugasemdir:\n${data.notes}` : '',
    '',
    status === 'tentative' ? '⏳ ÓSTAÐFEST — Bíður eftir staðfestingu' : '',
    status === 'confirmed' ? '✅ STAÐFEST' : '',
  ].filter(Boolean).join('\n');

  const prefix = status === 'tentative' ? '[ÓSTAÐFEST] ' : '';
  return {
    summary: `${prefix}${data.service || 'Þrif'} — ${data.name || 'Bókun'}`,
    location: data.address || '',
    description: description,
    start: { dateTime: startDateTime.toISOString(), timeZone: 'Atlantic/Reykjavik' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'Atlantic/Reykjavik' },
    status: status === 'tentative' ? 'tentative' : 'confirmed',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, data, eventId } = req.body;
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (action === 'create' || !action) {
      if (!data || !data.date || !data.time) return res.status(400).json({ error: 'Missing date/time' });
      const event = buildEvent(data, 'tentative');
      const result = await calendar.events.insert({ calendarId, requestBody: event });
      return res.status(200).json({ success: true, eventId: result.data.id, eventLink: result.data.htmlLink });
    }

    if (action === 'confirm') {
      if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
      const event = buildEvent(data, 'confirmed');
      const result = await calendar.events.update({ calendarId, eventId, requestBody: event });
      return res.status(200).json({ success: true, eventId: result.data.id });
    }

    if (action === 'cancel') {
      if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
      await calendar.events.delete({ calendarId, eventId });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('Calendar error:', err);
    return res.status(500).json({ error: err.message });
  }
}
