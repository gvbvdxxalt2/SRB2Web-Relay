var util = require("../req-util.js");
var netgames = {};

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

  constructor(hostRws, request) {
    this.active = true;
    this.url = UDPNetgame.generateURL(request);
    netgames[this.url] = this;
    this.host = hostRws;
    this.connections = {};

    this.sendUrl();
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
    this.connections = {};
    this.active = false;
    this.url = "";
    this.host.send(
      JSON.stringify({
        method: "closed",
      })
    );
    this.host = null;
  }

  closeOther(relayID) {
    var rws = this.connections[relayID];
    if (!rws) {
      return;
    }
    rws.netgameClose();
  }

  send(relayID, data) {
    var rws = this.connections[relayID];
    if (!rws) {
      return;
    }
    rws.send(
      JSON.stringify({
        method: "data",
        data: data,
      })
    );
  }

  join(rws) {
    if (!this.active) {
      return false;
    }
    var _this = this;
    //Find a open spot.
    var relayID = 1;
    while (this.connections[relayID]) {
      relayID += 1;
    }
    this.connections[relayID] = rws;
    //Add util functions to interact with the server.
    rws.netgameID = relayID;
    rws.netgameSend = function (data) {
      _this.handleSend(relayID, data);
    };
    rws.netgameClose = function () {
      _this.handleClose(relayID);
    };
    //Send to the host.
    if (!this.host) {
      return;
    }
    this.host.send(
      JSON.stringify({
        method: "joined",
        id: relayID,
        ip: rws.ip,
      })
    );
  }

  handleClose(relayID) {
    var rws = this.connections[relayID];
    if (!rws) {
      return;
    }
    if (!this.host) {
      return;
    }
    this.host.send(
      JSON.stringify({
        method: "leave",
        id: relayID,
      })
    );
    rws.send(
      JSON.stringify({
        method: "closed",
      })
    );
    rws.netgameID = null;
    rws.netgameClose = null;
    rws.netgameSend = null;
    delete this.connections[relayID];
  }

  handleSend(relayID, data) {
    if (!this.host) {
      return;
    }
    var rws = this.connections[relayID];
    if (!rws) {
      return;
    }
    rws.send(
      JSON.stringify({
        method: "data",
        data: data,
        id: relayID,
      })
    );
  }
}

module.exports = {
  UDPNetgame,
};
