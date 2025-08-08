// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const app = express();
app.use(cors());
app.use(express.json());

// Serve your client static files (put client in ./public)
app.use(express.static(path.join(__dirname, 'public')));

// Provide a simple health route
app.get('/health', (req, res) => res.json({ ok: true }));

// Serve engine files under /engine (you will place stockfish.js + stockfish.wasm here)
app.use('/engine', express.static(path.join(__dirname, 'engine')));

// Start HTTP server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// PeerServer mounted on /peerjs (auto-signaling)
const peerServer = ExpressPeerServer(server, {
  debug: false,
  path: '/',        // path for websocket upgrade
  allow_discovery: false,
});
app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log('Peer connected:', client.id);
});
peerServer.on('disconnect', (client) => {
  console.log('Peer disconnected:', client.id);
});
