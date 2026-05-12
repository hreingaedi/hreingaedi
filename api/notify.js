import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  if (isNaN(d)) return String(dateInput);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
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
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#111827;">
        <div style="background-color:#ffffff;text-align:center;padding:24px 16px;border-bottom:1px solid #e5e7eb;">
          <img src="https://hreingaedi.is/logo.png" alt="Hrein Gæði" style="max-width:200px;height:auto;display:inline-block;" width="200" />
        </div>
        <div style="padding:24px;">
          <div style="border-bottom:2px solid #1a56db;padding-bottom:12px;margin-bottom:24px;">
            <h1 style="font-size:20px;font-weight:600;margin:0;color:#111827;">Hrein Gæði</h1>
            <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">${title}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            ${rows}
          </table>
          <p style="font-size:12px;color:#9ca3af;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;">Sent from hreingaedi.is</p>
        </div>
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
        ${row('Dagsetning', formatDate(data.date))}
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
    } else if (type === 'customer_confirmation') {
      const toEmail = data.email;
      if (!toEmail) return res.status(400).json({ error: 'Missing customer email' });
      subject = `✅ Bókun staðfest — Hrein Gæði`;
      html = wrapper('Bókunin þín er staðfest!', `
        ${row('Sæl/l', data.name)}
        ${row('', 'Við höfum staðfest bókunina þína og hlökkum til að mæta. Hér eru upplýsingarnar:')}
        ${row('Þjónusta', data.service)}
        ${row('Dagsetning', formatDate(data.date))}
        ${row('Tími', data.time)}
        ${row('Heimilisfang', data.address)}
        ${row('Bókunarnúmer', data.ref)}
        ${row('', '')}
        ${row('', 'Ef þú þarft að breyta eða afbóka, hafðu samband við okkur í tíma á hreingaedi@hreingaedi.is')}
        ${row('', 'Takk fyrir traustið! — Hrein Gæði')}
      `);
      const { data: sentConf, error: errConf } = await resend.emails.send({
        from: 'Hrein Gæði Bókanir <hreingaedi@hreingaedi.is>',
        to: [toEmail],
        subject,
        html,
      });
      if (errConf) return res.status(500).json({ error: errConf.message });
      return res.status(200).json({ success: true, id: sentConf.id });
    } else if (type === 'customer_cancellation') {
      const toEmail = data.email;
      if (!toEmail) return res.status(400).json({ error: 'Missing customer email' });
      subject = `Bókun afbókuð — Hrein Gæði`;
      html = wrapper('Bókunin þín hefur verið afbókuð', `
        ${row('Sæl/l', data.name)}
        ${row('', 'Bókunin þín hefur verið afbókuð. Hér eru upplýsingarnar sem voru skráðar:')}
        ${row('Þjónusta', data.service)}
        ${row('Dagsetning', formatDate(data.date))}
        ${row('Tími', data.time)}
        ${row('Bókunarnúmer', data.ref)}
        ${row('', '')}
        ${row('', 'Hafðu samband ef þú vilt bóka aftur á öðrum tíma: hreingaedi@hreingaedi.is')}
        ${row('', 'Með kveðju, Hrein Gæði')}
      `);
      const { data: sentCanc, error: errCanc } = await resend.emails.send({
        from: 'Hrein Gæði Bókanir <hreingaedi@hreingaedi.is>',
        to: [toEmail],
        subject,
        html,
      });
      if (errCanc) return res.status(500).json({ error: errCanc.message });
      return res.status(200).json({ success: true, id: sentCanc.id });
    } else if (type === 'customer_received') {
      const toEmail = data.email;
      if (!toEmail) return res.status(400).json({ error: 'Missing customer email' });
      subject = `Við höfum móttekið pöntun þína — Hrein Gæði`;
      html = wrapper('Takk fyrir bókunina!', `
        ${row('Sæl/l', data.name)}
        ${row('', 'Við höfum móttekið bókunarbeiðnina þína og munum hafa samband við þig innan 24 klukkustunda til að staðfesta tímann.')}
        ${row('Þjónusta', data.service)}
        ${row('Dagsetning', formatDate(data.date))}
        ${row('Tími', data.time)}
        ${row('Heimilisfang', data.address)}
        ${row('Tilvísun', data.ref)}
        ${row('', '')}
        ${row('', 'Hafðu samband við okkur ef þú hefur einhverjar spurningar: <a href="mailto:hreingaedi@hreingaedi.is" style="color:#1a56db;">hreingaedi@hreingaedi.is</a>')}
        ${row('', 'Með kveðju, Hrein Gæði')}
      `);
      const { data: sentRcv, error: errRcv } = await resend.emails.send({
        from: 'Hrein Gæði Bókanir <hreingaedi@hreingaedi.is>',
        to: [toEmail],
        subject,
        html,
      });
      if (errRcv) return res.status(500).json({ error: errRcv.message });
      return res.status(200).json({ success: true, id: sentRcv.id });
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
