var ws = require("ws");
var { handleGhost } = require("./ghost.js");
var { UDPNetgame } = require("../netgame/");
var HostDataChannel = require("../netgame/datach.js");
var WSErrorCodes = require("./errors.js");
var config = require("../config.js");
var {setCorsHeaders} = require("./serve");
var wss = new ws.WebSocketServer({
  noServer: true,
  ...config.WebsocketConfig,
});

function handleUpgrade(request, socket, head) {
  var url = decodeURIComponent(request.url);
  var urlsplit = url.split("/");

  if (urlsplit[1] == "host") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      handleGhost(ws);
      wss.emit("connection", ws, request);
      var isPublic = urlsplit[2] == "public";
      var netgame = new UDPNetgame(ws, request, isPublic);
    });
    return;
  }

  if (urlsplit[1] == "listench") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      handleGhost(ws);
      wss.emit("connection", ws, request);
      HostDataChannel.handleWsOpenChannel(ws, urlsplit[2]);
    });
    return;
  }

  if (urlsplit[1] == "connect") {
    UDPNetgame.handleConnection(
      {
        request,
        socket,
        head,
      },
      urlsplit[2]
    );
    return;
  }

  wss.handleUpgrade(request, socket, head, function done(ws) {
    handleGhost(ws);
    wss.emit("connection", ws, request);
    ws.close(WSErrorCodes.BAD_PATH);
  });
}

module.exports = { handleUpgrade };
