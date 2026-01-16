var util = require("../req-util.js");
var NetBin = require("../netbin/");

class ResumeableWebsocket {
  static MAX_QUEUE = 8000; //Max queue length.
  static CLOSE_TIMEOUT = 3000; //How long would the resumable websocket stay after closing.

  constructor(ws, request, id) {
    this.ws = ws;
    this.request = request;
    this.id = id;
    this.sendQueue = [];
    this.closeTimeout = null;
    this.state = null;
    this.ip = util.getIP(request);

    this.sendResumableID();
  }

  setState(stateConstructor, ...args) {
    this.onclose = function () {};
    this.ondata = function () {};
    this.onresume = function () {};
    this.state = new stateConstructor(this, ...args);
  }

  onclose() {} //Overriden later.
  ondata() {} //Overridden later.
  onresume() {} //Overridden later.

  send(data) {
    //Pervents flooding the server.
    if (this.sendQueue.length < ResumeableWebsocket.MAX_QUEUE) {
      this.sendQueue.push(data);
    }
    if (this.ws) {
      this.handleSendQueue();
    }
  }

  handleData(data) {
    this.ondata(data);
  }

  handleResume(ws) {
    clearTimeout(this.closeTimeout);
    this.ws = ws;
    this.handleSendQueue();
    this.onresume();
  }

  handleSendQueue() {
    if (!this.ws) {
      return;
    }
    var queue = Array.from(this.sendQueue);
    for (var msg of queue) {
      this.ws.send(msg);
    }
    this.sendQueue = [];
  }

  resumableTimedOut() {} //Overriden later.

  resetState() {} //Overriden later.

  handleClose() {
    var _this = this;
    this.ws = null;
    this.closeTimeout = setTimeout(() => {
      if (_this.resumableTimedOut) {
        _this.resumableTimedOut();
      }
      _this.onclose();
    }, ResumeableWebsocket.CLOSE_TIMEOUT);
  }

  sendResumableID() {
    this.send(NetBin.encode(["resumable", this.id]));
  }
}

module.exports = { ResumeableWebsocket };
