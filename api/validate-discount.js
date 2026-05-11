import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ valid: false, error: 'Method not allowed' });

  try {
    const { code, service, total } = req.body || {};

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Vinsamlegast sláðu inn kóða' });
    }

    const codeNormalized = String(code).trim().toUpperCase();

    const { data: discount, error: lookupError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', codeNormalized)
      .maybeSingle();

    if (lookupError || !discount) {
      return res.status(200).json({ valid: false, error: 'Ógildur kóði' });
    }

    if (!discount.active) {
      return res.status(200).json({ valid: false, error: 'Kóðinn er ekki virkur' });
    }

    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return res.status(200).json({ valid: false, error: 'Kóðinn er ekki virkur ennþá' });
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return res.status(200).json({ valid: false, error: 'Kóðinn er útrunninn' });
    }

    if (discount.max_uses !== null && discount.current_uses >= discount.max_uses) {
      return res.status(200).json({ valid: false, error: 'Kóðinn hefur verið notaður upp' });
    }

    if (discount.min_booking_amount && total && Number(total) < Number(discount.min_booking_amount)) {
      return res.status(200).json({
        valid: false,
        error: `Lágmarksupphæð fyrir þennan kóða er ${discount.min_booking_amount.toLocaleString('is-IS')} kr`
      });
    }

    let discountAmount = 0;
    if (discount.discount_type === 'percent') {
      discountAmount = Math.round((Number(total) || 0) * Number(discount.discount_value) / 100);
    } else if (discount.discount_type === 'fixed') {
      discountAmount = Math.min(Number(discount.discount_value), Number(total) || 0);
    }

    return res.status(200).json({
      valid: true,
      code: codeNormalized,
      discount_type: discount.discount_type,
      discount_value: Number(discount.discount_value),
      discount_amount: discountAmount,
      first_booking_only: discount.first_booking_only
    });
  } catch (err) {
    console.error('Validate discount error:', err);
    return res.status(500).json({ valid: false, error: 'Óvænt villa' });
  }
}
