var fs = require("fs");
var path = require("path");
var process = require("process");
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

config.WEBRTC_CONFIG = JSON.parse(
    fs
    .readFileSync(path.join(configDirectory, "webrtc.json"), {
      encoding: "UTF-8",
    })
    .trim()
  );

console.log("[INFO]: Loaded "+config.WEBRTC_CONFIG.iceServers.length+" WebRTC ice servers.");

module.exports = config;
