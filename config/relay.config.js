module.exports = {
  USE_X_FORWARDED_FOR: true, //Turn this off if you aren't proxying (port forward the relay server).

  ON_RENDER_COM: true, //This makes the X_FORWARDED_FOR property work on render.com, .

  ALLOW_PUBLIC_NETGAMES: true, //Lets people allow their netgames to be public on this relay server.

  DEFAULT_PORT: 3000, //Default port for the relay server, can be changed also by setting the PORT env

  DEBUG_BAD_MESSAGE: true, //Log parsing errors from incoming requests and websocket data.

  DATA_CHANNEL_INACTIVE_TIMEOUT: 10000, //Ten seconds before a connection times out because no data sent.

  PUBLIC_SERVER_DEFAULT_NAME: "SRB2 Server", //Default name for public servers.

  WebsocketConfig: {
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 16 * 1024, // 16KB (Higher is better for CPU than 1024)
        memLevel: 5, // Balance between memory usage and speed
        level: 0,
      },
      zlibInflateOptions: {
        chunkSize: 16 * 1024, // Match default to avoid excessive allocations
      },
      // If you have FEW connections (<50), set these to false to save CPU.
      // If you have MANY connections, set to true to save RAM (prevent crash).
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,

      serverMaxWindowBits: 10, // Keeps memory footprint small
      concurrencyLimit: 5, // Lower limit to prevent blocking the event loop
      threshold: 2048, // Don't compress messages under 2KB (saves CPU)
    },
    clientTracking: false,
  },
};
