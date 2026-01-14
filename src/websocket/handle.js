var { handleGhost } = require("./ghost.js");
var { ResumeableWebsocket } = require("./resume.js");

var resumables = {};

function generateResumableID() {
  var i = 0;
  while (!resumables[i]) {
    i += 1;
  }
  return i;
}

function handleConnection(ws, request) {
  handleGhost(ws);
  var rid = generateResumableID();
  var resumable = new ResumeableWebsocket(ws, request, rid);
  resumables[rid] = resumable;
}

module.exports = { handleConnection };
