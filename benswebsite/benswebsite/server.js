const express = require('express');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = new sqlite3.Database('./chat.db');

// Create messages table if not exists
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  message TEXT,
  timestamp INTEGER
)`);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

const connectedGuests = new Map();

io.on('connection', (socket) => {
  const isAdmin = socket.handshake.query.admin === 'true';
  if (isAdmin) {
    socket.on('login-admin', () => {
      // On admin login, send all chat history
      db.all('SELECT * FROM messages ORDER BY timestamp ASC', [], (err, rows) => {
        if (!err) {
          socket.emit('chat-history', rows);
        }
      });
    });

    socket.on('send-message', (data) => {
      const msg = {
        username: 'Ben',
        message: data.message,
        timestamp: Date.now(),
      };
      // Store message
      db.run('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)', [msg.username, msg.message, msg.timestamp]);
      // Broadcast to all guests and admins
      io.emit('new-message', msg);
    });
  } else {
    // Guest user
    let guestName = 'Guest_' + Math.floor(Math.random() * 10000);
    connectedGuests.set(socket.id, guestName);

    socket.on('send-message', (data) => {
      const msg = {
        username: guestName,
        message: data.message,
        timestamp: Date.now(),
      };
      // Store message
      db.run('INSERT INTO messages (username, message, timestamp) VALUES (?, ?, ?)', [msg.username, msg.message, msg.timestamp]);
      // Broadcast to all admins and guests
      io.emit('new-message', msg);
    });

    socket.on('disconnect', () => {
      connectedGuests.delete(socket.id);
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});