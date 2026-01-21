var config = require("../config.js");
var publicNetgames = {};

class PublicNetgame {
  constructor(url) {
    this.url = url;
    this.name = config.PUBLIC_SERVER_DEFAULT_NAME;
    this.map = "";
    this.mapTitle = "";
    this.ingamePlayers = 0;
    this.playerNames = [];

    publicNetgames[this.url] = this; //Register it
  }

  updatePlayerNames(text = "") {
    var arr = text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => !!n);
    this.playerNames = arr;
    return arr;
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
        map: netinfo.map,
        mapTitle: netinfo.mapTitle,
        ingamePlayers: netinfo.ingamePlayers,
        playerNames: netinfo.playerNames,
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
