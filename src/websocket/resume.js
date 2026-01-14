class ResumeableWebsocket {
  static MAX_QUEUE = 8000; //Max queue length.
  static CLOSE_TIMEOUT = 2000; //How long would the resumable websocket stay.

  constructor(ws, request, id) {
    this.ws = ws;
    this.request = request;
    this.id = id;
    this.sendQueue = [];
    this.closeTimeout = null;
    this.state = null;
  }

  setState(stateConstructor) {
    this.onclose = function () {};
    this.ondata = function () {};
    this.state = new stateConstructor(this);
  }

  onclose() {} //Overriden later.
  ondata() {} //Overridden later.

  send(data) {
    //Pervents flooding the server.
    if (this.sendQueue.length < ResumeableWebsocket.MAX_QUEUE) {
      this.sendQueue.push(data);
    }
    if (this.ws) {
      this.handleSendQueue();
    }
  }

  handleResume() {
    clearTimeout(this.closeTimeout);
    this.handleSendQueue();
  }

  handleSendQueue() {
    if (!this.ws) {
      return;
    }
    var queue = Array.from(this.sendQueue);
    for (var msg of queue) {
      this.ws.send(queue);
    }
    this.sendQueue = [];
  }

  handleClose() {
    var _this = this;
    this.ws = null;
    this.closeTimeout = setTimeout(() => {
      _this.onclose();
    });
  }
}

module.exports = { ResumeableWebsocket };
