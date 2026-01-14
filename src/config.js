var fs = require("fs");
var path = require("path");
var configDirectory = path.join(__dirname, "../config/");

var baseConfig = require("../config/relay.config.js");
var config = { ...baseConfig };

config.description = fs.readFileSync(
  path.join(configDirectory, "description.txt"),
  { encoding: "UTF-8" }
);

console.log(config);

module.exports = config;
