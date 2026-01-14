var config = require("../config.js");
var ConnectState = require("./connect.js");
var ListenState = require("./listen.js");

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
      var json = JSON.parse(data);
    } catch (e) {
      if (config.DEBUG_BAD_JSON) {
        console.log(e);
      }
      return;
    }

    if (json.method == "listen") {
      rws.setState(ListenState);
    }

    if (json.method == "connect") {
      if (typeof json.url !== "string") {
        return;
      }
      rws.setState(ConnectState, json.url);
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
