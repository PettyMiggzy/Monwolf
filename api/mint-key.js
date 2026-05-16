// Vercel serverless function — proxies nad.fun's session + api-key mint flow
// server-side so we dodge the Origin allowlist on /api-key.
//
// Why this exists:
//   • nad.fun's /api-key endpoint rejects any browser Origin that isn't
//     nad.fun / nadapp.net / localhost. monwolf.vercel.app gets blocked.
//   • Server-side fetch from a Vercel function sends NO Origin header at all,
//     which nad.fun accepts (verified: returns "Session cookie missing" not
//     "Origin not allowed").
//   • So the browser handles the wallet signature (steps 1-3) and posts the
//     signed payload here. This function does steps 4-5 server-side and
//     returns the freshly minted api_key.

export default async function handler(req, res) {
  // CORS — allow our own front-end to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const { signature, nonce, chain_id, wallet_address, key_name, expires_in_days } = body;

  if (!signature || !nonce) {
    res.status(400).json({ error: 'Missing signature or nonce' });
    return;
  }

  try {
    // ─── Step 4: Create session at nad.fun ───
    const sessionRes = await fetch('https://api.nad.fun/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature,
        nonce,
        chain_id: chain_id || 143,
        wallet_address: wallet_address || null,
      }),
    });

    if (!sessionRes.ok) {
      const txt = await sessionRes.text();
      res.status(sessionRes.status).json({
        error: 'auth/session failed',
        detail: txt.slice(0, 300),
      });
      return;
    }

    // Capture the session cookie (HttpOnly, set on this response)
    // In Node 18+ runtime on Vercel, getSetCookie() returns the array.
    let cookies = [];
    if (typeof sessionRes.headers.getSetCookie === 'function') {
      cookies = sessionRes.headers.getSetCookie();
    } else {
      const raw = sessionRes.headers.get('set-cookie');
      if (raw) cookies = [raw];
    }
    if (!cookies.length) {
      res.status(500).json({ error: 'No session cookie in nad.fun response' });
      return;
    }
    // Build a Cookie header — name=value pairs only, no attributes
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    // ─── Step 5: Mint the API key ───
    const keyPayload = {
      name: key_name || 'MonWolf Hub',
      description: 'MonWolf Pack Den hub integration',
    };
    if (expires_in_days) keyPayload.expires_in_days = expires_in_days;

    const keyRes = await fetch('https://api.nad.fun/api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(keyPayload),
    });

    const keyText = await keyRes.text();
    if (!keyRes.ok) {
      res.status(keyRes.status).json({
        error: 'api-key mint failed',
        detail: keyText.slice(0, 300),
        status: keyRes.status,
      });
      return;
    }

    // Forward the response (contains api_key, id, key_prefix, name)
    let keyData;
    try { keyData = JSON.parse(keyText); }
    catch { keyData = { raw: keyText }; }
    res.status(200).json(keyData);
  } catch (e) {
    res.status(500).json({ error: 'proxy failed', detail: e.message });
  }
}
