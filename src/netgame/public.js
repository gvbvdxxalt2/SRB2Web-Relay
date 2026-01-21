var config = require("../config.js");
var publicNetgames = {};

class PublicNetgame {
  constructor(url, name) {
    this.url = url;
    this.name = name;
  }

  unlist() {
    delete publicNetgames[this.url];
  }
}

class PublicNetGameManager {
  static listPublicNetgames() {
    var keys = Object.keys(publicNetgames);
    for (var key of keys) {
      //if ()
    }
  }

  static registerPublic(url, info) {
    var netinfo = new PublicNetgame(
      url,
      info.name || config.PUBLIC_SERVER_DEFAULT_NAME
    );
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
