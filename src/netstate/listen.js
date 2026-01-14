var config = require("../config.js");
var { UDPNetgame } = require("../netgame");

class ListenState {
  constructor(rws) {
    this.rws = rws;
    this.netgame = null;
    this.init();
  }

  initNetgame() {
    var { rws } = this;

    var netgame = new UDPNetgame(rws, rws.request);
    this.netgame = netgame;
  }

  init() {
    var { rws } = this;
    rws.ondata = this.handleData.bind(this);
    rws.onclose = this.handleClose.bind(this);
    rws.onresume = this.handleResume.bind(this);

    this.initNetgame();
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
      if (typeof json.id !== "number") {
        return;
      }
      if (typeof json.data !== "string") {
        return;
      }
      netgame.send(json.id, json.data);
    }

    if (json.method == "close_other") {
      if (typeof json.id !== "number") {
        return;
      }
      netgame.closeOther(json.id);
    }

    if (json.method == "close") {
      netgame.close();
      rws.resetState();
    }
  }
  handleClose() {
    var { rws, netgame } = this;
    netgame.close();
  }
  handleResume() {
    var { rws, netgame } = this;
    netgame.sendUrl();
  }
}

module.exports = ListenState;
