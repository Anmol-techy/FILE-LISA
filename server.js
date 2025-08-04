const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const receivers = new Map();

app.use(express.static(__dirname));

wss.on('connection', (ws) => {
  let userId = Math.random().toString(36).substring(2, 10);

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'registerReceiver') {
      receivers.set(ws, userId);
    }

    if (data.type === 'getReceivers') {
      const activeUsers = Array.from(receivers.values());
      ws.send(JSON.stringify({ type: 'receiverList', users: activeUsers }));
    }

    if (data.type === 'sendFile') {
      const targetSocket = [...receivers.entries()].find(([, id]) => id === data.to)?.[0];
      if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        data.files.forEach(file => {
          targetSocket.send(JSON.stringify({
            type: 'incomingFile',
            file: file.data,
            filename: file.name
          }));
        });
      }
    }
  });

  ws.on('close', () => {
    receivers.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
