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
