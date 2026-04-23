import { google } from 'googleapis';

// Parses Icelandic booking time strings into start/end hours and minutes.
// Handles ranges like "8:00–10:00" (en-dash or hyphen) and named slots.
function parseBookingTime(timeString) {
  const named = {
    'Morgunn':       { startHour: 9,  startMinute: 0, endHour: 12, endMinute: 0 },
    'Eftirmiðdagur': { startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 },
    'Kvöld':         { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  };
  if (named[timeString]) return named[timeString];

  // Match "H:MM–H:MM" or "H:MM-H:MM" (en-dash or regular hyphen)
  const match = timeString.match(/^(\d{1,2}):(\d{2})[–\-](\d{1,2}):(\d{2})$/);
  if (match) {
    return {
      startHour:   parseInt(match[1]),
      startMinute: parseInt(match[2]),
      endHour:     parseInt(match[3]),
      endMinute:   parseInt(match[4]),
    };
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data } = req.body;
    if (!data || !data.date || !data.time) {
      return res.status(400).json({ error: 'Missing date/time' });
    }

    const credentials = JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS);
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const impersonate = process.env.GOOGLE_IMPERSONATE_USER;

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
      subject: impersonate,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const parsed = parseBookingTime(data.time);

    let startDateTime, endDateTime;

    if (parsed) {
      // Use the booked time range directly
      startDateTime = new Date(data.date);
      startDateTime.setHours(parsed.startHour, parsed.startMinute, 0, 0);
      endDateTime = new Date(data.date);
      endDateTime.setHours(parsed.endHour, parsed.endMinute, 0, 0);
    } else {
      // Fallback: duration based on service type and size
      let durationMinutes = 120;
      if (data.service === 'Heimilisþrif' && data.size) {
        const sqm = parseInt(data.size);
        if (!isNaN(sqm)) durationMinutes = Math.max(90, Math.min(300, Math.round(sqm * 0.8)));
      } else if (data.service === 'AirBnB þrif') {
        durationMinutes = 90;
      }
      startDateTime = new Date(`${data.date}T10:00:00`);
      endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
    }

    const description = [
      `Þjónusta: ${data.service || ''}`,
      `Nafn: ${data.name || ''}`,
      `Sími: ${data.phone || ''}`,
      `Email: ${data.email || ''}`,
      data.size ? `Stærð: ${data.size}` : '',
      data.estimated_price ? `Verð: ${data.estimated_price} kr` : '',
      '',
      data.notes ? `Athugasemdir:\n${data.notes}` : '',
    ].filter(Boolean).join('\n');

    const event = {
      summary: `${data.service || 'Þrif'} — ${data.name || 'Bókun'}`,
      location: data.address || '',
      description: description,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'Atlantic/Reykjavik' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'Atlantic/Reykjavik' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const result = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return res.status(200).json({ success: true, eventId: result.data.id, eventLink: result.data.htmlLink });
  } catch (err) {
    console.error('Calendar error:', err);
    return res.status(500).json({ error: err.message });
  }
}
