var ws = require("ws");
var fs = require("fs");
var path = require("path");
var http = require("http");
var process = require("process");
var config = require("./config.js");
var URL = require("url");

var publicServers = {};

var mimeTypes = require("./mime.js");

function setNoCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
}

function terminateGhostSockets(ws) {
  var isAlive = true;
  var terminated = false;

  function heartbeat() {
    isAlive = true;
  }

  ws.on("pong", heartbeat);

  var interval = setInterval(() => {
    if (!isAlive) {
      if (!terminated) {
        terminated = true;
        clearInterval(interval);
        ws.terminate();
        //ws.emit("close");
      }
      return;
    }

    isAlive = false;
    try {
      ws.ping();
    } catch (err) {
      if (!terminated) {
        terminated = true;
        clearInterval(interval);
        ws.terminate();
        //ws.emit("close");
      }
    }
  }, 1500); // Check every 1500 miliseconds.

  ws.on("close", () => {
    if (!terminated) {
      terminated = true;
      clearInterval(interval);
    }
  });

  try {
    ws.ping();
  } catch (err) {
    // Socket might already be broken
    if (!terminated) {
      terminated = true;
      clearInterval(interval);
      ws.terminate();
    }
  }
}

function getIPFromRequest(req) {
  if (config.USE_X_FORWARDED_FOR) {
    var forwardedForHeader = req.headers["x-forwarded-for"];
    if (forwardedForHeader) {
      if (config.ON_RENDER_COM) {
        var IPString = "" + forwardedForHeader;
        var IPs = IPString.split(",").map((ip) => ip.trim());
        return IPs[0];
      } else {
        return forwardedForHeader;
      }
    }
  }
  return req.socket.remoteAddress;
}

function runStaticStuff(req, res, otheroptions, basePath = "./public/") {
  var url = URL.parse(req.url);
  var pathname = url.pathname;

  setNoCorsHeaders(res);

  var file = path.join(basePath, pathname);
  if (file.split(".").length < 2) {
    var _lastfile = file.toString();
    file += ".html";
    if (!fs.existsSync(file)) {
      file = path.join(_lastfile, "/index.html");
    }
  }

  if (!fs.existsSync(file)) {
    file = "errors/404.html";
    res.statusCode = 404;
  }
  if (otheroptions) {
    if (typeof otheroptions.status == "number") {
      file = "errors/" + otheroptions.status + ".html";
      res.statusCode = otheroptions.status;
    }
  }

  var extension = file.split(".").pop().toLowerCase();

  var mime = mimeTypes[extension];
  if (mime) {
    res.setHeader("content-type", mime);
  }
  if (extension == "html" || extension == "js") {
    res.setHeader("Content-Type", mime + "; charset=utf-8");
    res.end(fs.readFileSync(file, { encoding: "utf-8" }));
  } else {
    fs.createReadStream(file).pipe(res);
  }
}

var server = http.createServer(function (req, res) {
  var url = decodeURIComponent(req.url);
  var urlsplit = url.split("/");

  if (!config.ALLOW_PUBLIC_NETGAMES) {
    runStaticStuff(req,res, {}, "./public-unlisted-only/");
    return;
  }

  if (urlsplit[1] == "netgames") {
    res.end(JSON.stringify(Object.keys(publicServers)));
    return;
  }
  
  runStaticStuff(req,res, {}, "./public/");
});

var wss = new ws.WebSocketServer({ noServer: true });
var netgames = {};

wss.on("connection", (ws, request) => {
  //ws._relayIP = Math.round((Math.random() * 255) + 1) + "." + Math.round((Math.random() * 255) + 1) + "." + Math.round((Math.random() * 255) + 1) + "." + Math.round((Math.random() * 255) + 1);
  ws._relayIP = getIPFromRequest(request);

  var currentNetgame = null;
  var isListening = false;

  ws.on("message", (data) => {
    try {
      var json = JSON.parse(data.toString());
    } catch (e) {
      console.log("Unable to parse json: ", e);
      return;
    }

    if (json.method == "data") {
      if (!currentNetgame) {
        return;
      }
      if (isListening) {
        // Server is listening, send to the client with matching id
        var connection = currentNetgame.connections.find(
          (w) => json.id == w._rid
        );
        if (!connection) {
          return;
        }
        //console.log("Server transmitting data to client: " + json.id);
        connection.send(
          JSON.stringify({
            method: "data",
            data: json.data,
            id: ws._rid, // From the server's perspective
            ip: ws._relayIP,
            port: ws._relayPort
          })
        );
      } else {
        // Client is connected, send to server
        currentNetgame.send(ws, json.data, json.id);
      }
    }

    if (json.method == "connect") {
      if (typeof json.id !== "string") {
        return;
      }
      if (currentNetgame) {
        return;
      }
      var id = json.id.trim().toLowerCase();
      if (id.indexOf(":") == -1) {
        id += ":5029";
      }
      if (netgames[id]) {
        currentNetgame = netgames[id];
        isListening = false;
        currentNetgame.open(ws);
        //console.log("Client connected to "+id);
        ws.send(JSON.stringify({ method: "connected" }));
      } else {
        ws.send(
          JSON.stringify({ method: "error", message: "Netgame not found" })
        );
      }
    }

    if (json.method == "listen") {
      if (currentNetgame) {
        return;
      }
      isListening = true;
      var num = 5029;
      var netId = ws._relayIP + ":" + num;
      while (netgames[netId]) {
        num += 1;
        netId = ws._relayIP + ":" + num;
      }

      currentNetgame = {
        id: netId,
        connections: [],
        open: function (otherWs) {
          if (!currentNetgame) {
            return;
          }
          var customId = currentNetgame.connections.length + 1;
          otherWs._rid = customId;
          currentNetgame.connections.push(otherWs);
          otherWs._relayPort = 1000;
          for (var con of currentNetgame.connections) {
            if (con._relayPort == otherWs._relayPort) {
              otherWs._relayPort = con._relayPort + 1;
            }
          }
          /*console.log(
            "Client joined netgame: " + netId + " as ID: " + customId
          );*/
          // Notify the server about the join
          ws.send(
            JSON.stringify({
              method: "join",
              id: customId,
              ip: otherWs._relayIP,
              port: otherWs._relayPort
            })
          );
        },
        send: function (otherWs, data, customId) {
          if (!currentNetgame) {
            return;
          }
          if (!otherWs._rid) {
            currentNetgame.open(otherWs, customId);
          }
          // Send to the listening server (ws)
          ws.send(
            JSON.stringify({
              method: "data",
              data: data,
              id: otherWs._rid,
              ip: otherWs._relayIP,
              port: otherWs._relayPort
            })
          );
        },
        close: function (otherWs) {
          if (!currentNetgame) {
            return;
          }
          currentNetgame.connections = currentNetgame.connections.filter(
            (w) => w._rid !== otherWs._rid
          );
          // Notify the server about the leave
          ws.send(JSON.stringify({ method: "leave", id: otherWs._rid }));
          otherWs._rid = null;
        },
      };
      netgames[netId] = currentNetgame;
      if (json.public && config.ALLOW_PUBLIC_NETGAMES) {
        publicServers[netId] = true;
      }
      //console.log("Now listening on: " + netId);
      ws._rid = 0; // Server's ID
      ws.send(JSON.stringify({ method: "listening", listening: netId }));
    }

    if (json.method == "close") {
      isListening = false;
      if (currentNetgame && isListening) {
        delete netgames[currentNetgame.id];
        delete publicServers[currentNetgame.id];
      }
      currentNetgame = null;
    }

    if (json.method == "ping") {
      ws.send(JSON.stringify({ method: "pong" }));
    }
  });

  ws.on("close", () => {
    if (currentNetgame) {
      if (isListening) {
        delete netgames[currentNetgame.id];
        delete publicServers[currentNetgame.id];
      } else {
        currentNetgame.close(ws);
      }
    }
    isListening = false;
    currentNetgame = null;
  });

  terminateGhostSockets(ws);

  ws.send(
    JSON.stringify({
      method: "ready",
      ip: ws._relayIP,
    })
  );
});

server.on("upgrade", function (request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
});

server.listen(+process.env.PORT || config.DEFAULT_PORT);
