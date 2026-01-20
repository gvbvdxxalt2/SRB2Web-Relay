var dataChannelQueue = {};
var WSErrorCodes = require("../websocket/errors.js");

function generateRandomStuff(randomLength = 8) {
  var timeComponent = Date.now().toString(36);
  var safeCharacters = "23456789abcdefghijkmnpqrstuvwxy";
  var randomComponent = "";

  for (var i = 0; i < randomLength; i++) {
    const randomIndex = Math.floor(Math.random() * safeCharacters.length);
    randomComponent += safeCharacters.charAt(randomIndex);
  }
  return `${timeComponent}z${randomComponent}`;
}

class HostDataChannel {
  static CONNECT_TIMEOUT = 3000;

  static handleWsOpenChannel(ws, id = "") {
    var f = dataChannelQueue[id.trim()];
    if (!f) {
      //console.log("Host connect error");
      ws.close();
      return;
    }
    f(new HostDataChannel(ws));
    delete dataChannelQueue[id];
  }

  static requestDataChannel(onchannel) {
    var code = generateRandomStuff();
    var timeout = setTimeout(() => {
      onchannel(null);
      delete dataChannelQueue[code];
    }, HostDataChannel.CONNECT_TIMEOUT);
    dataChannelQueue[code] = function (channel) {
      clearTimeout(timeout);
      onchannel(channel);
    };

    return code;
  }

  constructor(ws) {
    this.ws = ws;
    var _this = this;
    ws.on("message", (data) => {
      if (_this.ondata) {
        _this.ondata(data);
      }
    });
    ws.on("close", () => {
      if (_this.onclose) {
        _this.onclose();
      }
    });
  }

  ondata() {}

  onclose() {}

  send(data) {
    if (this.ws) {
      this.ws.send(data);
    }
  }

  dispose() {
    if (this.ws) {
      if (this.onclose) {
        this.onclose();
      }
      this.onclose = null;
      this.ondata = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = HostDataChannel;
