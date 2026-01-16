var config = require("../config.js");
var { UDPNetgame } = require("../netgame");
var NetBin = require("../netbin/");

class ConnectState {
  constructor(rws, url) {
    this.rws = rws;
    this.url = url;
    this.connected = false;
    this.init();
  }

  init() {
    var { rws, url } = this;
    rws.ondata = this.handleData.bind(this);
    rws.onclose = this.handleClose.bind(this);
    rws.onresume = this.handleResume.bind(this);
    var netgame = UDPNetgame.findNetgame(url);
    if (netgame) {
      this.connected = true;
      this.netgame = netgame;
      netgame.join(rws);
      rws.send(NetBin.encode(["connected"]));
    } else {
      rws.send(NetBin.encode(["closed"]));
      rws.resetState();
    }
  }

  handleNetgameClose() {
    var { rws } = this;
    this.connected = false;
    this.netgame = null;
    rws.resetState();
  }

  handleData(data) {
    var { rws, netgame } = this;
    try {
      var decoded = NetBin.decode(new Uint8Array(data));
    } catch (e) {
      if (config.DEBUG_BAD_MESSAGE) {
        console.log(e);
      }
      return;
    }

    if (decoded.items[0] == "data") {
      if (!rws.netgameSend) {
        return;
      }
      rws.netgameSend(decoded.bin);
    }

    if (decoded.items[0] == "close") {
      if (!rws.netgameClose) {
        return;
      }
      rws.netgameClose();
    }
  }
  handleClose() {
    var { rws } = this;

    if (!rws.netgameClose) {
      return;
    }
    rws.netgameClose();
  }
  handleResume() {
    var { rws } = this;
    rws.send(NetBin.encode(["connected"]));
  }
}

module.exports = ConnectState;
