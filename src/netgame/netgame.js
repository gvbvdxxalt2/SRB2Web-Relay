var util = require("../req-util.js");
var NetBin = require("../netbin/");
//var HostDataChannel = require("./datach.js");
var WSErrorCodes = require("../websocket/errors.js");
var netgames = {};
var config = require("../config.js");

var { handleGhost } = require("../websocket/ghost.js");
var ws = require("ws");
var PublicManager = require("./public.js");
var wss = new ws.WebSocketServer({
  noServer: true,
  ...config.WebsocketConfig,
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

  constructor(hostws, request, isPublic = false) {
    this.active = true;
    this.url = UDPNetgame.generateURL(request);
    netgames[this.url] = this;
    this.host = hostws;
    this.isPublic = isPublic;
    this.connections = {};

    if (isPublic) {
      this.netinfo = PublicManager.registerPublic(this.url);
    }

    this.initHostSocket();
  }

  static HANDLING_CONNECTION = "handling";
  static CLOSING_NETGAME = "closing";

  handleJoin(request, socket, head) {
    var id = 1;
    while (this.connections[id]) {
      id += 1;
    }
    this.connections[id] = UDPNetgame.HANDLING_CONNECTION;

    var { host } = this;
    var _this = this;
    wss.handleUpgrade(request, socket, head, function done(ws) {
      
      if (_this.connections[id] == UDPNetgame.CLOSING_NETGAME) {
        //Netgame already ended/kicked so just close the connection once it's ready.
        
        handleGhost(ws);
        wss.emit("connection", ws, request);

        setTimeout(() => {
          try{
            ws.close();
          }catch(e){}
        },100);
        return;
      }

      host.send(
        JSON.stringify({
          method: "connection",
          id,
          ip: util.getIP(request),
        })
      );

      handleGhost(ws);
      wss.emit("connection", ws, request);

      ws.on("close", () => {
        _this.connections[id] = "";
        delete _this.connections[id];
        try{
          host.send(
            JSON.stringify({
              method: "disconnect",
              id,
            })
          );
        }catch(e){}
      });
      
      ws.on("message", (data, isBinary) => {
        if (isBinary) {
          ws.close(WSErrorCodes.BINARY_NOT_SUPPORTED);
          return;
        }
        host.send(
          JSON.stringify({
            method: "message",
            id,
            data: ""+data,
          })
        );
      });

      _this.connections[id] = ws;
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
    if (this.isPublic) {
      if (this.netinfo) { //Slightly safer than assuming it exists, in case something went wrong during registration.
        this.netinfo.unlist();
      }
    }
    this.closeClients();
    this.active = false;
    this.url = "";
  }

  closeClients() {
    for (var id of Object.keys(this.connections)) {
      if (typeof this.connections[id] !== "string") {
        this.connections[id].close();
        this.connections[id] = "";
        delete this.connections[id];
      } else {
        this.connections[id] = UDPNetgame.CLOSING_NETGAME; //This closes the connection after connecting to avoid silent connections.
      }
    }
  }

  initHostSocket() {
    var _this = this;
    var { host } = this;
    this.sendUrl();

    host.on("message", (data, isBinary) => {
      try {
        var json = JSON.parse(""+data);
      } catch (e) {
        if (config.DEBUG_BAD_MESSAGE) {
          console.log("[WARNING]: ",e);
        }
        return;
      }

      if (json.update && _this.isPublic) { //Updating netgame information.
        var netinfo = _this.netinfo;
        netinfo.isAlive = true; //Usually an update message means we're alive so this netgame can be listed.
        
        if (typeof json.name == "string") {
          netinfo.name = json.name;
        }
        if (typeof json.map == "string") {
          netinfo.map = json.map;
        }
        if (typeof json.mapTitle == "string") {
          netinfo.mapTitle = json.mapTitle;
        }
        if (typeof json.ingamePlayers == "number") {
          netinfo.ingamePlayers = json.ingamePlayers;
        }
        if (typeof json.playerNames == "string") {
          netinfo.updatePlayerNames(json.playerNames);
        }
        if (typeof json.maxPlayers == "number") {
          netinfo.maxPlayers = json.maxPlayers;
        }
        return;
      }
      
      if (typeof json.data == "string" && typeof json.id == "number") { //Sending message to an websocket connection.
        var socket = _this.connections[json.id];
        if (!socket) {
          return;
        }
        socket.send(json.data);
        return;
      }

      if (json.disconnect && typeof json.id == "number") { //Disconnect a websocket.
        var socket = _this.connections[json.id];
        if (!socket) {
          return;
        }
        try{
        socket.close();
        }catch(e){}
      }
    });

    host.on("close", () => {
      _this.close();
      _this.host = null;
    });
  }
}

module.exports = {
  UDPNetgame,
};
