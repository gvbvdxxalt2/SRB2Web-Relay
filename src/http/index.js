var { serveStatic, setCorsHeaders } = require("../serve");
var config = require("../config.js");
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

  serveStatic(req, res);
}

module.exports = { onHttpRequest };
