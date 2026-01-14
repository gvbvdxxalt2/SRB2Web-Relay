var config = require("../config.js");

class IdleState {
  constructor(rws) {
    this.rws = rws;
    this.init();
  }

  init() {
    var { rws } = this;
    rws.ondata = this.handleData.bind(this);
    rws.onclose = this.handleClose.bind(this);
  }

  handleData(data) {
    try {
      var json = JSON.parse(data);
    } catch (e) {
      if (config.DEBUG_BAD_JSON) {
        console.log(e);
      }
      return;
    }
  }
  handleClose() {}
}

module.exports = IdleState;
