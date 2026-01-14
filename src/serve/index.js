var fs = require("fs");
var path = require("path");
var mimeTypes = require("./mime.js");
var URL = require("url");

function setCorsHeaders(res) {
  //Used to set CORS headers so that they don't cause issues when connecting from SRB2Web.
  res.setHeader("Access-Control-Allow-Origin", "*");
}

function serveStatic(req, res, otheroptions, basePath = "./public/") {
  //Basic static serve for stuff.
  var url = URL.parse(req.url);
  var pathname = url.pathname;

  var file = path.join(basePath, pathname);
  if (file.split(".").length < 2) {
    var _lastfile = file.toString();
    file += ".html";
    if (!fs.existsSync(file)) {
      file = path.join(_lastfile, "/index.html");
    }
  }

  if (!fs.existsSync(file)) {
    file = "errors/404.html";
    res.statusCode = 404;
  }
  if (otheroptions) {
    if (typeof otheroptions.status == "number") {
      file = "errors/" + otheroptions.status + ".html";
      res.statusCode = otheroptions.status;
    }
  }

  var extension = file.split(".").pop().toLowerCase();

  var mime = mimeTypes[extension];
  if (mime) {
    res.setHeader("content-type", mime);
  }
  if (extension == "html" || extension == "js") {
    res.setHeader("Content-Type", mime + "; charset=utf-8");
    res.end(fs.readFileSync(file, { encoding: "utf-8" }));
  } else {
    fs.createReadStream(file).pipe(res);
  }
}

module.exports = { serveStatic, setCorsHeaders };
