var config = require("../config.js");
var { UDPNetgame } = require("../netgame");
var NetBin = require("../netbin/");

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
      var decoded = NetBin.decode(new Uint8Array(data));
    } catch (e) {
      if (config.DEBUG_BAD_MESSAGE) {
        console.log(e);
      }
      return;
    }

    if (decoded.items[0] == "data") {
      if (typeof decoded.items[1] !== "number") {
        return;
      }
      netgame.send(decoded.items[1], decoded.bin);
    }

    if (decoded.items[0] == "close_other") {
      if (typeof decoded.items[1] !== "number") {
        return;
      }
      netgame.closeOther(decoded.items[1]);
    }

    if (decoded.items[0] == "close") {
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
