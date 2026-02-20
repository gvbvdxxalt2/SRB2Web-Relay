# Sonic Robo Blast 2 - Web Relay Server

[This server is exclusively compatible with this repository!](https://github.com/gvbvdxxalt2/SRB2web/)

This server helps SRB2web connect to other players' netgames and host web games. It uses IP addresses to manage connections in memory.

---

## Setup

Install dependencies:
```bash
npm install
```

Run the server (defaults to port 3000):
> **Note:** You cannot run this on the same port as the SRB2web development server.

```bash
npm run start
```

Run on a custom port (Linux/macOS):
```bash
PORT=8080 npm run start
```
