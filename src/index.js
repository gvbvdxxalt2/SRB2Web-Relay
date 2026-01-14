var { serveStatic, setCorsHeaders } = require("./serve");
var config = require("./config.js");

var http = require("http");
var process = require("process");

async function onRequest(req, res) {
  setCorsHeaders(res);
  serveStatic(req, res);
}

var server = http.createServer(onRequest);
var { wss } = require("./websocket");

var currentPort = +process.env.PORT || +config.DEFAULT_PORT;
server.listen(currentPort);

server.on("upgrade", function (request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
});

console.log(`Relay server is now active on port ${currentPort}`);
