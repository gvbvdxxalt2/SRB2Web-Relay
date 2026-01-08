module.exports = {
    USE_X_FORWARDED_FOR: true, //Turn this off if you aren't proxying (port forward the relay server).
    ON_RENDER_COM: true, //This makes the X_FORWARDED_FOR property work on render.com, .
    ALLOW_PUBLIC_NETGAMES: false, //Lets people allow their netgames to be public on this relay server.
    DEFAULT_PORT: 3000 //Default port for the relay server, can be changed also by setting the PORT env 
};