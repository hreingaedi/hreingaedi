import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    let subject = '';
    let html = '';

    const wrapper = (title, rows) => `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827;">
        <div style="border-bottom:2px solid #1a56db;padding-bottom:12px;margin-bottom:24px;">
          <h1 style="font-size:20px;font-weight:600;margin:0;color:#111827;">Hrein Gæði</h1>
          <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">${title}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${rows}
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;">Sent from hreingaedi.is</p>
      </div>
    `;

    const row = (label, value) => value ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top;">${label}</td><td style="padding:8px 0;font-size:14px;color:#111827;">${value}</td></tr>` : '';

    if (type === 'booking') {
      subject = `🧹 Ný bókun — ${data.service || 'Þrif'} — ${data.name || 'Nafn ekki gefið'}`;
      html = wrapper('Ný bókun á netinu', `
        ${row('Þjónusta', data.service)}
        ${row('Nafn', data.name)}
        ${row('Sími', data.phone)}
        ${row('Email', data.email)}
        ${row('Heimilisfang', data.address)}
        ${row('Stærð', data.size ? data.size + ' m²' : null)}
        ${row('Tíðni', data.frequency)}
        ${row('Dagsetning', data.date)}
        ${row('Tími', data.time)}
        ${row('Athugasemdir', data.notes)}
        ${row('Verð áætlað', data.estimated_price ? data.estimated_price + ' kr' : null)}
      `);
    } else if (type === 'company_quote') {
      subject = `💼 Ný fyrirspurn — ${data.company_name || data.name || 'Fyrirtæki'}`;
      html = wrapper('Ný fyrirspurn frá fyrirtæki', `
        ${row('Þjónusta', data.service)}
        ${row('Fyrirtæki', data.company_name)}
        ${row('Tengiliður', data.name)}
        ${row('Sími', data.phone)}
        ${row('Email', data.email)}
        ${row('Heimilisfang', data.address)}
        ${row('Skilaboð', data.message)}
      `);
    } else if (type === 'contact') {
      subject = `✉️ Ný skilaboð — ${data.name || 'Nafn ekki gefið'}`;
      html = wrapper('Ný skilaboð úr vefformi', `
        ${row('Nafn', data.name)}
        ${row('Sími', data.phone)}
        ${row('Email', data.email)}
        ${row('Skilaboð', data.message)}
      `);
    } else {
      return res.status(400).json({ error: 'Unknown notification type' });
    }

    const { data: sent, error } = await resend.emails.send({
      from: 'Hrein Gæði <hreingaedi@hreingaedi.is>',
      to: [NOTIFICATION_EMAIL],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: sent.id });
  } catch (err) {
    console.error('Notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}
