var config = require("./config.js");

function isPrivateIp(ip) {
  if (!ip) return false;

  // Handle IPv6 localhost
  if (ip === '::1' || ip === 'localhost') return true;

  // Split the IP into its 4 parts (octets)
  const parts = ip.split('.');
  if (parts.length !== 4) return false; // Not a standard IPv4 address

  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);

  // 127.x.x.x (Localhost)
  if (first === 127) return true;

  // 10.x.x.x (Private network)
  if (first === 10) return true;

  // 192.168.x.x (Private network)
  if (first === 192 && second === 168) return true;

  // 172.16.x.x through 172.31.x.x (Private network)
  if (first === 172 && second >= 16 && second <= 31) return true;

  return false;
}
function getIP(req) {
  if (config.USE_CLOUDFLARE_CONNECTING_IP) {
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }
  }
  if (config.USE_X_FORWARDED_FOR) {
    var forwardedForHeader = req.headers["x-forwarded-for"];
    if (forwardedForHeader) {
      forwardedForHeader = forwardedForHeader.trim();
      if (config.ON_RENDER_COM) {
        var IPString = "" + forwardedForHeader;
        var IPs = IPString.split(",").map((ip) => ip.trim());
        var i = IPs.length-1;
      	while (i > 0) {
      		var curIp = IPs[i];
      		if (!isPrivateIp(curIp)) {
      			return curIp;
      		}
      		i -= 1;
      	}
      } else {
        return forwardedForHeader;
      }
    }
  }
  return ("" + req.socket.remoteAddress).trim();
}

module.exports = { getIP };
