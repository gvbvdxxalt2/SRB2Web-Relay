var { serveStatic, setCorsHeaders } = require("./serve");
var config = require("./config.js");

var http = require("http");
var process = require("process");

var { onHttpRequest } = require("./http");
var server = http.createServer(onHttpRequest);

var currentPort = +process.env.PORT || +config.DEFAULT_PORT;
server.listen(currentPort);

var { handleUpgrade } = require("./websocket");
server.on("upgrade", handleUpgrade);

console.log(`Relay server is now active on port ${currentPort}`);