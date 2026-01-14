var { handleGhost } = require("./ghost.js");
var { ResumeableWebsocket } = require("./resume.js");
var { IdleState } = require("../netstate");

var resumables = {};

function generateRandom(randomLength = 8) {
  var timeComponent = Date.now().toString(36);
  var safeCharacters = "23456789abcdefghijkmnpqrstuvwxy";
  var randomComponent = "";

  for (var i = 0; i < randomLength; i++) {
    const randomIndex = Math.floor(Math.random() * safeCharacters.length);
    randomComponent += safeCharacters.charAt(randomIndex);
  }
  return `${timeComponent}z${randomComponent}`;
}

function generateResumableID() {
  var i = 0;
  while (resumables[i]) {
    i += 1;
  }
  return generateRandom() + "z" + i;
}

function handleConnection(ws, request) {
  var url = decodeURIComponent(request.url);
  var urlsplit = url.split("/");
  handleGhost(ws);

  var rid = urlsplit[1];
  var resumable = null;
  if (rid && resumables[rid]) {
    var savedResumable = resumables[rid];
    //Only resume if was disconnected.
    if (!savedResumable.ws) {
      resumable = savedResumable; //Resume where we left off.
    }
  }
  if (resumable) {
    resumable.handleResume(ws);
  } else {
    rid = generateResumableID();
    resumable = new ResumeableWebsocket(ws, request, rid);
    resumable.resumableTimedOut = function () {
      delete resumables[rid];
    };
    resumables[rid] = resumable;
    resumable.resetState = function () {
      resumable.setState(IdleState);
    };
    resumable.resetState();
  }
  ws.on("message", (data) => {
    resumable.handleData(data);
  });
  ws.on("close", () => {
    resumable.handleClose();
  });
}

module.exports = { handleConnection };
