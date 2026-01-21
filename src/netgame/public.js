var config = require("../config.js");
var publicNetgames = {};

class PublicNetgame {
  constructor(url, name, netgame) {
    this.name = name;
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
    return;
  }
}

module.exports = PublicNetGameManager;
