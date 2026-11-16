import fs from 'fs';

const ROOT = new URL('..', import.meta.url).pathname;

// Pull one function's source out of an HTML file by brace-matching.
function extract(file, name) {
  const s = fs.readFileSync(`${ROOT}/${file}`, 'utf8');
  const start = s.indexOf(`async function ${name}(`);
  if (start < 0) throw new Error(`${name} not found in ${file}`);
  let i = s.indexOf('{', start), depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(start, j + 1); }
  }
  throw new Error('unbalanced');
}

// One scenario: dbOk / mailOk toggled, returns what the customer + business got.
async function run(file, fn, { dbFails, mailFails, fields }) {
  const log = { alerted: false, notified: null, tracked: null, succeeded: false };

  const els = new Proxy({}, { get: (_, id) => ({ value: fields[id] ?? '', textContent: '', style: {}, classList: { remove(){}, add(){} } }) });
  const ctx = {
    console: { error(){}, warn(){}, log(){} },
    lang: 'is',
    alert: () => { log.alerted = true; },
    hgTrack: (e, d) => { log.tracked = { event: e, ...d }; },
    state: { type: 'home', sqm: 80, sqmLabel: '60-90', basePrice: 24900, extrasTotal: 0,
             total: 24900, date: '2026-10-01', time: '09:00', name: 'Jón', phone: '8881111',
             email: 'jon@example.is', address: 'Laugavegur 1', postal: '101', city: 'Reykjavík',
             supplies: 'company_all', discountCode: null, discountAmount: 0 },
    sb: {
      from: () => ({
        insert: async () => dbFails ? { error: { message: 'Supabase paused' } } : { error: null },
        update: () => ({ eq: async () => ({ error: null }) })
      }),
      rpc: async () => ({ error: null })
    },
    fetch: async (url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.type === 'booking' || body.type === 'company_quote' || body.type === 'contact') {
        log.notified = body;
        if (mailFails) return { ok: false, status: 500 };
      }
      return { ok: true, json: async () => ({}) };
    },
    document: {
      getElementById: (id) => els[id],
      querySelectorAll: () => [],
      querySelector: () => null
    },
    window: { scrollTo(){} }
  };

  const src = extract(file, fn);
  const names = Object.keys(ctx);
  const body = `${src}; return ${fn}();`;
  try {
    await new Function(...names, body)(...names.map(n => ctx[n]));
    log.succeeded = !log.alerted;
  } catch (e) { log.error = e.message; }
  return log;
}

const CASES = [
  ['booking.html',  'submitBooking',     'Booking'],
  ['booking.html',  'submitQuote',       'Quote (booking page)'],
  ['contact.html',  'submitContact',     'Contact'],
  ['services.html', 'submitCompanyForm', 'Quote (services page)'],
];
const FIELDS = { 'f-access':'Lykill undir mottu', 'f-notes':'Köttur á heimilinu',
  'q-company':'Kaupfélag ehf','q-kt':'','q-size':'250','q-freq':'weekly','q-address':'Hlíðar 4',
  'q-notes':'Vikuleg þrif','q-name':'Anna','q-phone':'8882222','q-email':'anna@k.is',
  'cf-company':'Kaupfélag ehf','cf-kt':'','cf-size':'250','cf-freq':'weekly','cf-notes':'Vikuleg þrif',
  'cf-name':'Anna','cf-phone':'8882222','cf-email':'anna@k.is',
  'c-name':'Jón','c-email':'jon@x.is','c-phone':'8881111','c-subject':'Fyrirspurn','c-message':'Halló' };

let pass = 0, fail = 0;
const check = (label, cond, detail='') => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label} ${detail}`); }
};

for (const [file, fn, label] of CASES) {
  console.log(`\n${label} — ${file}:${fn}`);

  let r = await run(file, fn, { dbFails: false, mailFails: false, fields: FIELDS });
  check('happy path: email sent, no error shown', r.notified && !r.alerted, JSON.stringify(r));
  check('happy path: not flagged as degraded', r.notified?.data.db_failed === false, `got ${r.notified?.data.db_failed}`);

  r = await run(file, fn, { dbFails: true, mailFails: false, fields: FIELDS });
  check('DB DOWN: email still sent (lead survives)', !!r.notified, JSON.stringify(r));
  check('DB DOWN: email flagged db_failed', r.notified?.data.db_failed === true, `got ${r.notified?.data.db_failed}`);
  check('DB DOWN: customer sees success, not an error', !r.alerted);
  check('DB DOWN: conversion tracked as degraded', r.tracked?.degraded === true, JSON.stringify(r.tracked));

  r = await run(file, fn, { dbFails: true, mailFails: true, fields: FIELDS });
  check('BOTH DOWN: customer IS told to retry', r.alerted, JSON.stringify(r));
  check('BOTH DOWN: no false conversion tracked', r.tracked === null, JSON.stringify(r.tracked));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
