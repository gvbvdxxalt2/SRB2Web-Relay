var config = require("./config.js");

function isPrivateIp(ip) {
  if (!ip) return false;

  // Clean up IPv6-mapped IPv4 addresses (e.g., ::ffff:10.0.0.1)
  let cleanIp = ip.replace(/^::ffff:/, '');

  if (cleanIp === '::1' || cleanIp === 'localhost') return true;

  const parts = cleanIp.split('.');
  if (parts.length !== 4) return false;

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  if (first === 127 || first === 10) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;

  return false;
}

function getIP(req) {
  if (config.USE_CLOUDFLARE_CONNECTING_IP && req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  if (config.USE_X_FORWARDED_FOR) {
    const forwardedForHeader = req.headers["x-forwarded-for"];
    if (forwardedForHeader) {
      if (config.ON_RENDER_COM) {
        const IPs = forwardedForHeader.split(",").map((ip) => ip.trim());
        
        // FIX: Use >= 0 so we check the first IP in the list
        for (let i = IPs.length - 1; i >= 0; i--) {
          if (!isPrivateIp(IPs[i])) {
            return IPs[i];
          }
        }
        // If everything was private, fallback to the first one anyway
        return IPs[0];
      } else {
        return forwardedForHeader.trim();
      }
    }
  }

  return ("" + req.socket.remoteAddress).replace(/^::ffff:/, '').trim();
}

module.exports = { getIP };
