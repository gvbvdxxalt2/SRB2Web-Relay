var config = require("../config.js");
var ConnectState = require("./connect.js");
var ListenState = require("./listen.js");
var NetBin = require("../netbin/");

class IdleState {
  constructor(rws) {
    this.rws = rws;
    this.init();
  }

  init() {
    var { rws } = this;
    rws.ondata = this.handleData.bind(this);
    rws.onclose = this.handleClose.bind(this);
    rws.onresume = this.handleResume.bind(this);
  }

  handleData(data) {
    var { rws } = this;
    try {
      var decoded = NetBin.decode(new Uint8Array(data));
    } catch (e) {
      if (config.DEBUG_BAD_MESSAGE) {
        console.log(e);
      }
      return;
    }

    if (decoded.items[0] == "listen") {
      rws.setState(ListenState);
    }

    if (decoded.items[0] == "connect") {
      if (typeof decoded.items[1] !== "string") {
        return;
      }
      rws.setState(ConnectState, decoded.items[1]);
    }
  }
  handleClose() {
    var { rws } = this;
  }
  handleResume() {
    var { rws } = this;
  }
}

module.exports = IdleState;
