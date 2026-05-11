import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, source = 'popup' } = req.body || {};

    const emailLower = String(email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ error: 'Ógilt netfang' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || null;

    const { error: insertError } = await supabase
      .from('email_subscribers')
      .insert({ email: emailLower, source, ip_address: ip });

    if (insertError) {
      if (insertError.code !== '23505') {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Gat ekki vistað skráningu' });
      }
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Hrein Gæði <hreingaedi@hreingaedi.is>',
      to: emailLower,
      subject: 'Velkomin! Hér er afsláttarkóðinn þinn',
      html: getWelcomeEmailHtml(emailLower)
    });

    if (emailError) {
      console.error('Email error:', emailError);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Óvænt villa' });
  }
}

function getWelcomeEmailHtml(email) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#111827;">
    <div style="background-color:#ffffff;text-align:center;padding:24px 16px;border-bottom:1px solid #e5e7eb;">
      <img src="https://hreingaedi.is/logo.png" alt="Hrein Gæði"
           style="max-width:200px;height:auto;display:inline-block;" width="200" />
    </div>
    <div style="padding:32px 24px;">
      <h1 style="font-size:22px;font-weight:600;margin:0 0 8px;color:#111827;">Velkomin á póstlistann!</h1>
      <p style="font-size:15px;color:#4b5563;line-height:1.5;margin:0 0 24px;">
        Takk fyrir að skrá þig. Hér er afsláttarkóðinn þinn fyrir 10% afslátt af fyrstu bókun:
      </p>
      <div style="background:#f0f9ff;border:2px dashed #1a56db;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Þinn afsláttarkóði</p>
        <p style="font-family:'JetBrains Mono','SF Mono',monospace;font-size:28px;font-weight:600;color:#1a56db;margin:0;letter-spacing:0.05em;">VELKOMIN10</p>
      </div>
      <p style="font-size:14px;color:#4b5563;line-height:1.5;margin:0 0 16px;">
        Sláðu inn kóðann í bókunarferlinu á <a href="https://hreingaedi.is/booking" style="color:#1a56db;text-decoration:none;">hreingaedi.is/booking</a> til að fá afsláttinn.
      </p>
      <p style="font-size:13px;color:#9ca3af;line-height:1.5;margin:24px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;">
        Þú getur afskráð þig af póstlistanum með því að svara þessum tölvupósti með "AFSKRÁ".
      </p>
    </div>
  </div>
</body>
</html>`;
}
