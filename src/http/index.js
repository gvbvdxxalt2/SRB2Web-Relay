var { serveStatic, setCorsHeaders } = require("../serve");
var config = require("../config.js");
var { PublicManager } = require("../netgame");
var SRB2WebRelayVersion = require("../version.js");
var URL = require("url");

function onHttpRequest(req, res) {
  setCorsHeaders(res);

  var url = decodeURIComponent(req.url);
  var urlsplit = url.split("/");

  if (urlsplit[1] == "status") {
    res.end(
      JSON.stringify({
        status: "online",
        name: config.name,
        description: config.description,
      })
    );
    return;
  }
  if (urlsplit[1] == "public") {
    var list = PublicManager.listPublicNetgames();
    res.end(JSON.stringify(list));
    return;
  }
  if (urlsplit[1] == "countpublic") {
    var info = PublicManager.countPublicNetgames();
    res.end(JSON.stringify(info));
    return;
  }
  if (urlsplit[1] == "version") {
    var info = SRB2WebRelayVersion.HTTPContent;
    res.end(JSON.stringify(info));
    return;
  }
  if (urlsplit[1] == "iceconfig") {
    var info = config.WEBRTC_CONFIG;
    res.end(JSON.stringify(info));
    return;
  }

  serveStatic(req, res);
}

module.exports = { onHttpRequest };
