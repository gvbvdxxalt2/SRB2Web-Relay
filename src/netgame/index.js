var util = require("../req-util.js");
var netgames = {};

class UDPNetgame {
  static generateURL(request) {
    //Generates a host:port like url, to mimic how real port forwarding works.
    //Returns like: 1.2.3.4:5029
    var ip = util.getIP(request);

    var url = null;
    var port = 5029; //Start from 5029
    var found = false;
    while (!found) {
      url += ip + ":" + port;
      if (!netgames[url]) {
        //Empy netgame found.
        found = true;
      }
    }
    return url;
  }

  constructor(hostRws, request) {
    this.active = true;
    this.url = UDPNetgame.generateURL(request);
    this.hostWs = hostWs;
    this.connections = [];
  }

  join(rws) {
    this.connections.push(rws);
  }
}

module.exports = {
  UDPNetgame,
  generateURL: UDPNetgame.generateURL,
};
