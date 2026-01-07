var ws = require("ws");
var http = require("http");
var process = require("process");

function getIPFromRequest(req) {
  if (req.headers["x-forwarded-for"]) {
    var IPString = "" + req.headers["x-forwarded-for"];
    var IPs = IPString.split(",").map((ip) => ip.trim());
    return IPs[0];
  }
  return req.socket.remoteAddress;
}

var server = http.createServer(function (req, res) {
  res.end("");
});

var wss = new ws.WebSocketServer({ noServer: true });
var netgames = {};

wss.on("connection", (ws, request) => {
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
      //console.log("Client connecting to: " + id);
      if (netgames[id]) {
        currentNetgame = netgames[id];
        isListening = false;
        // Add this client to the netgame
        currentNetgame.open(ws);
        ws.send(JSON.stringify({ method: "connected" })); // Optional ack
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
          var customId = currentNetgame.connections.length + 1;
          otherWs._rid = customId;
          currentNetgame.connections.push(otherWs);
          /*console.log(
            "Client joined netgame: " + netId + " as ID: " + customId
          );*/
          // Notify the server about the join
          ws.send(
            JSON.stringify({
              method: "join",
              id: customId,
              ip: otherWs._relayIP,
            })
          );
        },
        send: function (otherWs, data, customId) {
          if (!otherWs._rid) {
            currentNetgame.open(otherWs, customId);
          }
          // Send to the listening server (ws)
          ws.send(
            JSON.stringify({
              method: "data",
              data: data,
              id: otherWs._rid,
            })
          );
        },
        close: function (otherWs) {
          currentNetgame.connections = currentNetgame.connections.filter(
            (w) => w._rid !== otherWs._rid
          );
          // Notify the server about the leave
          ws.send(JSON.stringify({ method: "leave", id: otherWs._rid }));
          otherWs._rid = null;
        },
      };
      netgames[netId] = currentNetgame;
      //console.log("Now listening on: " + netId);
      ws._rid = 0; // Server's ID
      ws.send(JSON.stringify({ method: "listening", listening: netId }));
    }

    if (json.method == "close") {
      isListening = false;
      if (currentNetgame && isListening) {
        delete netgames[currentNetgame.id];
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
      } else {
        currentNetgame.close(ws);
      }
    }
    isListening = false;
    currentNetgame = null;
  });

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

server.listen(+process.env.PORT || 3000);
