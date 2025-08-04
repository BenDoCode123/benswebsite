const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = new sqlite3.Database('chat.db');
db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, name TEXT, message TEXT, time TEXT)');

app.use(express.static('public'));

io.on('connection', (socket) => {
  let user = "Guest";
  let isAdmin = false;

  socket.on('login', ({ name, password }) => {
    if (name === "Ben" && password === "7453") {
      isAdmin = true;
      user = "Ben";
      socket.emit("login-success");
    } else {
      socket.emit("login-failed");
    }
  });

  socket.on('message', (msg) => {
    const timestamp = new Date().toLocaleString();
    db.run('INSERT INTO messages (name, message, time) VALUES (?, ?, ?)', [user, msg, timestamp]);
    io.emit('message', { user, msg, timestamp });
  });

  socket.on('get-messages', () => {
    if (isAdmin) {
      db.all('SELECT * FROM messages ORDER BY id DESC', (err, rows) => {
        socket.emit('all-messages', rows);
      });
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
