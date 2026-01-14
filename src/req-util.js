var config = require("./config.js");

function getIP(req) {
  if (config.USE_X_FORWARDED_FOR) {
    var forwardedForHeader = req.headers["x-forwarded-for"];
    if (forwardedForHeader) {
      forwardedForHeader = forwardedForHeader.trim();
      if (config.ON_RENDER_COM) {
        var IPString = "" + forwardedForHeader;
        var IPs = IPString.split(",").map((ip) => ip.trim());
        return IPs[0];
      } else {
        return forwardedForHeader;
      }
    }
  }
  return ("" + req.socket.remoteAddress).trim();
}

module.exports = { getIP };
