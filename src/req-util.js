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
  // 1. HIGHEST PRIORITY: Cloudflare/Render verified headers
  // Cloudflare is the most reliable because they strip fake headers from users.
  const verifiedHeaders = ['cf-connecting-ip', 'true-client-ip'];
  for (const header of verifiedHeaders) {
    if (req.headers[header]) {
      var headerString = "" + req.headers[header];
      return headerString.trim();
    }
  }

  // 2. SECOND PRIORITY: X-Forwarded-For
  if (config.USE_X_FORWARDED_FOR) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const IPs = forwarded.split(",").map(ip => ip.trim());
      
      // FIX: Loop all the way to 0, but since Render can use public IPs 
      // for proxies, on Render it's often safest to just take the FIRST IP
      // in the list, as that is the original sender.
      if (config.ON_RENDER_COM) {
        return IPs[0]; 
      }

      // Fallback: Right-to-left search for non-private
      for (let i = IPs.length - 1; i >= 0; i--) {
        if (!isPrivateIp(IPs[i])) {
          return IPs[i];
        }
      }
    }
  }

  // 3. FINAL FALLBACK: Direct socket address
  return ("" + req.socket.remoteAddress).replace(/^::ffff:/, '').trim();
}

module.exports = { getIP };
