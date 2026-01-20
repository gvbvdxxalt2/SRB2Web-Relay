var util = require("../req-util.js");
var NetBin = require("../netbin/");
var HostDataChannel = require("./datach.js");
var WSErrorCodes = require("../websocket/errors.js");
var netgames = {};

var { handleGhost } = require("../websocket/ghost.js");
var ws = require("ws");
var wss = new ws.WebSocketServer({
  noServer: true,
  clientTracking: false,
});

class UDPNetgame {
  static generateURL(request) {
    //Generates a host:port like url, to mimic how real port forwarding works.
    //Returns like: 1.2.3.4:5029
    var ip = util.getIP(request);

    var url = null;
    var port = 5029; //Start from 5029
    var found = false;
    while (!found) {
      url = ip + ":" + port;
      if (!netgames[url]) {
        //Empy netgame found.
        found = true;
      }
      port += 1;
    }
    return url.trim();
  }
  static findNetgame(url) {
    if (typeof url !== "string") {
      return null;
    }
    var finalUrl = url.trim();
    var netgame = netgames[finalUrl];
    if (netgame) {
      return netgame;
    }
    return null;
  }

  static handleConnection({ request, socket, head }, netgameURL) {
    var finalUrl = netgameURL.trim();
    var netgame = netgames[finalUrl];
    if (netgame) {
      return netgame.handleJoin(request, socket, head);
    }
    wss.handleUpgrade(request, socket, head, function done(ws) {
      handleGhost(ws);
      wss.emit("connection", ws, request);
      ws.close(WSErrorCodes.NETGAME_NOT_FOUND);
    });
  }

  constructor(hostws, request) {
    this.active = true;
    this.url = UDPNetgame.generateURL(request);
    netgames[this.url] = this;
    this.host = hostws;
    this.connections = {};

    this.initHostSocket();
  }

  static HANDLING_CONNECTION = "handling";

  handleJoin(request, socket, head) {
    var id = 1;
    while (this.connections[id]) {
      id += 1;
    }
    this.connections[id] = UDPNetgame.HANDLING_CONNECTION;

    var { host } = this;
    var _this = this;
    wss.handleUpgrade(request, socket, head, function done(ws) {
      handleGhost(ws);
      wss.emit("connection", ws, request);

      //Handle data channel.
      function handleChannel(ch) {
        if (!ch) {
          ws.close(WSErrorCodes.HOST_CONNECT_TIMEOUT);
          delete _this.connections[id];
          return;
        }
        _this.connections[id] = ws;

        var didClose = false;

        ch.onclose = function () {
          delete _this.connections[id];
          if (!didClose) {
            ws.close();
          }
        };

        ch.ondata = function (data) {
          //Host sending to connection.
          ws.send(data);
        };

        ws.on("message", (data) => {
          //Connection sending to host.
          ch.send(data);
        });

        ws.on("close", () => {
          didClose = true;
          ch.dispose(); //Calls onclose function.
        });
      }
      //Tell the host to contact and respond to the incoming connection.
      var code = HostDataChannel.requestDataChannel(handleChannel);
      host.send(
        JSON.stringify({
          method: "incoming",
          channel: code,
          id,
          ip: util.getIP(request),
        })
      );
    });
  }

  sendUrl() {
    if (!this.host) {
      return;
    }
    this.host.send(
      JSON.stringify({
        method: "listening",
        url: this.url,
      })
    );
  }

  close() {
    if (!this.active) {
      return;
    }
    delete netgames[this.url];
    this.closeClients();
    this.active = false;
    this.url = "";
  }

  closeClients() {
    for (var id of Object.keys(this.connections)) {
      if (typeof this.connections[id] !== "string") {
        this.connections[id].dispose();
      }
    }
  }

  initHostSocket() {
    var _this = this;
    var { host } = this;
    this.sendUrl();

    host.on("close", () => {
      _this.close();
      _this.host = null;
    });
  }
}

module.exports = {
  UDPNetgame,
};
