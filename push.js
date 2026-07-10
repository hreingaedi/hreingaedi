/* Hrein Gæði — push-notification client for the staff portal.
   Used by dashboard.html and worker.html. Requires an authenticated
   Supabase client. Subscriptions are stored in push_subscriptions
   (RLS: each user manages only their own rows).
   The VAPID public key below is public by design; the private key
   lives only in Vercel env vars. */

window.HGPush = (function () {
  const PUBLIC_KEY = 'BDq3Ik6xFerP9OoCFrO5GmmVoXEfikAV2u9DAhybiNn0kWbEHwIS2qVLYIU_fVvDReOmJBgk4awQEwJDjOn4fqE';

  let supa = null, uid = null, onChange = null;

  function b64ToU8(s) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map(function (c) { return c.charCodeAt(0); }));
  }

  function supported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  function fire(state) { if (onChange) onChange(state); }

  async function getSub() {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }

  async function save(sub) {
    const j = sub.toJSON();
    await supa.from('push_subscriptions')
      .upsert({ user_id: uid, endpoint: j.endpoint, subscription: j }, { onConflict: 'endpoint' });
  }

  /* Call once after login. cb receives: 'on' | 'off' | 'denied' | 'unsupported' */
  async function init(client, userId, cb) {
    supa = client; uid = userId; onChange = cb || null;
    if (!supported()) { fire('unsupported'); return; }
    try {
      await navigator.serviceWorker.register('/sw.js');
      if (Notification.permission === 'granted') {
        const sub = await getSub();
        if (sub) { await save(sub); fire('on'); return; }
      }
      fire(Notification.permission === 'denied' ? 'denied' : 'off');
    } catch (e) {
      console.error('Push init failed:', e);
      fire('unsupported');
    }
  }

  /* Must be called from a user gesture (tap/click) — iOS requirement. */
  async function enable() {
    if (!supported()) { fire('unsupported'); return false; }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { fire(perm === 'denied' ? 'denied' : 'off'); return false; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToU8(PUBLIC_KEY)
        });
      }
      await save(sub);
      fire('on');
      return true;
    } catch (e) {
      console.error('Push enable failed:', e);
      fire('off');
      return false;
    }
  }

  async function disable() {
    try {
      const sub = await getSub();
      if (sub) {
        await supa.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
    } catch (e) { console.error('Push disable failed:', e); }
    fire('off');
    return true;
  }

  async function toggle() {
    if (!supported()) { fire('unsupported'); return false; }
    const sub = Notification.permission === 'granted' ? await getSub() : null;
    return sub ? disable() : enable();
  }

  return { init: init, enable: enable, disable: disable, toggle: toggle, supported: supported };
})();
