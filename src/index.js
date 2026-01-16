var { serveStatic, setCorsHeaders } = require("./serve");
var config = require("./config.js");

var http = require("http");
var process = require("process");

var { onHttpRequest } = require("./http");
var server = http.createServer(onHttpRequest);

var currentPort = +process.env.PORT || +config.DEFAULT_PORT;
server.listen(currentPort);

var { wss } = require("./websocket");
server.on("upgrade", function (request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
});

console.log(`Relay server is now active on port ${currentPort}`);
/*
setTimeout(() => {
  var nb = require("./netbin/");
  var now = performance.now();
  var arr = [
    "test",
    "a1b2c3",
    "mkdkmlfvfmlklkmvklmdvmkvfmkdkmlfvfmlklkmvklmdvmkvfmkdkmlfvfmlklkmvklmdvmkvfmkdkmlfvfmlklkmvklmdvmkvfmkdkmlfvfmlklkmvklmdvmkvfmkdkmlfvfmlklkmvklmdvmkvfmkdkmlfvfmlklkmvklmdvmkvf",
    true,
    1,
    2,
    999999999999999999,
    "test",
  ];

  var binary = new Uint8Array([255, 2, 255]);
  var encoded = nb.encode(arr, binary);
  nb.decode(encoded);

  var finish = performance.now();

  var nbTime = finish - now;

  console.log(`Time encoding & decoding using netbin: ${finish - now}`);

  var now = performance.now();

  JSON.parse(JSON.stringify(arr));

  var finish = performance.now();

  var jsonTime = finish - now;

  console.log(`Time encoding & decoding using JSON: ${finish - now}`);

  if (nbTime > jsonTime) {
    console.log(`JSON encoding is faster`);
  } else {
    console.log(`Netbin encoding is faster`);
  }
}, 100);
*/
