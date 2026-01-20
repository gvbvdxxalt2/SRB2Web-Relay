var ws = require("ws");
var { handleGhost } = require("./ghost.js");
var { UDPNetgame } = require("../netgame/");
var HostDataChannel = require("../netgame/datach.js");
var WSErrorCodes = require("./errors.js");
var wss = new ws.WebSocketServer({
  noServer: true,
  clientTracking: false,
});

function handleUpgrade(request, socket, head) {
  var url = decodeURIComponent(request.url);
  var urlsplit = url.split("/");

  console.log(request.url);

  if (urlsplit[1] == "listen") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      handleGhost(ws);
      wss.emit("connection", ws, request);
      var netgame = new UDPNetgame(ws, request);
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
