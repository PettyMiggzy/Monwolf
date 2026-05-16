// Vercel serverless function — proxies nad.fun's session + api-key mint flow
// server-side so we dodge the Origin allowlist on /api-key.
//
// History: first attempt used ESM `export default`. Without a package.json
// declaring "type":"module", Vercel's default Node runtime treats .js as
// CommonJS and the export fails at load → 500. Switched to module.exports.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Parse body — Vercel auto-parses application/json, but be defensive
    let body = req.body;
    if (!body || typeof body === 'string') {
      const raw = await new Promise((resolve, reject) => {
        let buf = '';
        req.on('data', c => { buf += c; });
        req.on('end', () => resolve(buf));
        req.on('error', reject);
      });
      try { body = raw ? JSON.parse(raw) : {}; }
      catch (e) {
        res.status(400).json({ error: 'Invalid JSON body', detail: e.message });
        return;
      }
    }

    const { signature, nonce, chain_id, wallet_address, key_name, expires_in_days } = body || {};
    if (!signature || !nonce) {
      res.status(400).json({ error: 'Missing signature or nonce', got: Object.keys(body || {}) });
      return;
    }

    // ─── Step 4: Create session ───
    let sessionRes;
    try {
      sessionRes = await fetch('https://api.nad.fun/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          nonce,
          chain_id: chain_id || 143,
          wallet_address: wallet_address || null,
        }),
      });
    } catch (e) {
      res.status(502).json({ error: 'fetch to /auth/session threw', detail: e.message });
      return;
    }

    if (!sessionRes.ok) {
      const txt = await sessionRes.text().catch(() => '');
      res.status(sessionRes.status).json({
        error: 'auth/session failed',
        status: sessionRes.status,
        detail: txt.slice(0, 400),
      });
      return;
    }

    // Capture the session cookie from Set-Cookie
    let cookieValues = [];
    if (typeof sessionRes.headers.getSetCookie === 'function') {
      cookieValues = sessionRes.headers.getSetCookie();
    } else {
      const raw = sessionRes.headers.get('set-cookie');
      if (raw) cookieValues = [raw];
    }
    if (!cookieValues.length) {
      res.status(500).json({ error: 'No Set-Cookie header on /auth/session response' });
      return;
    }
    const cookieHeader = cookieValues.map(c => c.split(';')[0]).join('; ');

    // ─── Step 5: Mint the API key ───
    const payload = {
      name: key_name || 'MonWolf Hub',
      description: 'MonWolf Pack Den hub integration',
    };
    if (expires_in_days) payload.expires_in_days = expires_in_days;

    let keyRes;
    try {
      keyRes = await fetch('https://api.nad.fun/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      res.status(502).json({ error: 'fetch to /api-key threw', detail: e.message });
      return;
    }

    const keyText = await keyRes.text().catch(() => '');
    if (!keyRes.ok) {
      res.status(keyRes.status).json({
        error: 'api-key mint failed',
        status: keyRes.status,
        detail: keyText.slice(0, 400),
      });
      return;
    }

    let keyData;
    try { keyData = JSON.parse(keyText); }
    catch { keyData = { raw: keyText }; }
    res.status(200).json(keyData);
  } catch (e) {
    console.error('mint-key handler crashed:', e);
    res.status(500).json({ error: 'handler threw', detail: e.message, stack: (e.stack || '').split('\n').slice(0, 3) });
  }
};
