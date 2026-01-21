var config = require("../config.js");
var publicNetgames = {};

class PublicNetgame {
  constructor(url) {
    this.url = url;
    this.name = config.PUBLIC_SERVER_DEFAULT_NAME;
  }

  unlist() {
    delete publicNetgames[this.url];
  }
}

class PublicNetGameManager {
  static listPublicNetgames() {
    var output = [];
    var keys = Object.keys(publicNetgames);
    for (var url of keys) {
      var netinfo = publicNetgames[url];
      output.push({
        url,
        name: netinfo.name,
      });
    }

    return output;
  }

  static registerPublic(url) {
    var netinfo = new PublicNetgame(url);
    return netinfo;
  }

  static unlistPublic(url) {
    var netinfo = publicNetgames[url];
    if (!netinfo) {
      return;
    }
    netinfo.unlist();
  }
}

module.exports = PublicNetGameManager;
