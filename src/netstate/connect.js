var config = require("../config.js");
var { UDPNetgame } = require("../netgame");

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
      rws.send(
        JSON.stringify({
          method: "connected",
        })
      );
    } else {
      rws.send(
        JSON.stringify({
          method: "closed",
        })
      );
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
      var json = JSON.parse(data);
    } catch (e) {
      if (config.DEBUG_BAD_JSON) {
        console.log(e);
      }
      return;
    }

    if (json.method == "data") {
      if (!rws.netgameSend) {
        return;
      }
      if (typeof json.data !== "string") {
        return;
      }
      rws.netgameSend(json.data);
    }

    if (json.method == "close") {
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
    rws.send(
      JSON.stringify({
        method: "connected",
      })
    );
  }
}

module.exports = ConnectState;
