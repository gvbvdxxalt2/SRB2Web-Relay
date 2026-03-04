var config = require("./config.js");

function isPrivateIp(ip) {
  if (!ip) return false;
  // Clean IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, '');
  if (cleanIp === '::1' || cleanIp === 'localhost') return true;

  const parts = cleanIp.split('.');
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // Filter out standard private ranges
  if (first === 127 || first === 10) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;

  return false;
}

function getIP(req) {
  // 1. Priority: The 'cf-connecting-ip' is provided by Render's edge.
  // This is the "gold standard" and is very hard to spoof.
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp.trim();

  // 2. Fallback: Parse the X-Forwarded-For list.
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    // We split the list into an array of IPs.
    const IPs = xff.split(',').map(ip => ip.trim());

    // On Render, the user's real IP is ALWAYS the first one (index 0).
    // The others are Render/Azure/Cloudflare proxies.
    if (IPs.length > 0) {
      return IPs[0]; 
    }
  }

  // 3. Final Fallback: The direct connection IP (usually a proxy IP on Render)
  return (req.socket.remoteAddress || "").replace(/^::ffff:/, '').trim();
}

module.exports = { getIP };
