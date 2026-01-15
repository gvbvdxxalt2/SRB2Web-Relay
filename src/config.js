var fs = require("fs");
var path = require("path");
var configDirectory = path.join(__dirname, "../config/");

var baseConfig = require("../config/relay.config.js");
var config = { ...baseConfig };

config.description = fs
  .readFileSync(path.join(configDirectory, "description.txt"), {
    encoding: "UTF-8",
  })
  .trim();

config.name = fs
  .readFileSync(path.join(configDirectory, "name.txt"), {
    encoding: "UTF-8",
  })
  .trim();

module.exports = config;
