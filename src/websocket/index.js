var { handleConnection } = require("./handle.js");
var ws = require("ws");

var wss = new ws.WebSocketServer({ noServer: true, clientTracking: false });

wss.on("connection", handleConnection);

module.exports = { wss };
