const express = require('express');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = new sqlite3.Database('./chat.db');

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    isAdmin INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    status TEXT DEFAULT 'open',
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId INTEGER,
    sender TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticketId) REFERENCES tickets(id)
  )`);

  // Create admin user if not exists
  db.get("SELECT * FROM users WHERE username='admin'", (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users(username, password, isAdmin) VALUES ('admin', '7453', 1)`);
      console.log('Admin user created');
    }
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// User login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (user) {
      if (user.password === password) {
        return res.json({ success: true, isAdmin: user.isAdmin === 1, userId: user.id });
      } else {
        return res.json({ success: false, message: 'Incorrect password' });
      }
    } else {
      // Register new user automatically (optional)
      db.run("INSERT INTO users(username, password) VALUES (?, ?)", [username, password], function(err) {
        if (err) return res.status(500).json({ error: 'DB error on registration' });
        // Create ticket for this user
        db.run("INSERT INTO tickets(userId) VALUES (?)", [this.lastID], (e) => {
          if (e) return res.status(500).json({ error: 'DB error creating ticket' });
          return res.json({ success: true, isAdmin: false, userId: this.lastID });
        });
      });
    }
  });
});

// Get tickets for admin
app.get('/admin/tickets', (req, res) => {
  // For simplicity no auth middleware, you should add one
  db.all(`SELECT tickets.id as ticketId, users.username FROM tickets 
          JOIN users ON tickets.userId = users.id 
          WHERE tickets.status = 'open'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// Get messages for a ticket
app.get('/admin/tickets/:ticketId/messages', (req, res) => {
  const ticketId = req.params.ticketId;
  db.all("SELECT * FROM messages WHERE ticketId = ? ORDER BY timestamp ASC", [ticketId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

const connectedUsers = new Map(); // socketId -> { userId, username, isAdmin, ticketId }

// Socket.io chat handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ userId, username, isAdmin }) => {
    connectedUsers.set(socket.id, { userId, username, isAdmin, ticketId: null });
    console.log(`${username} joined chat`);
  });

  socket.on('start_ticket', (ticketId) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.ticketId = ticketId;
      socket.join(`ticket_${ticketId}`);
    }
  });

  socket.on('send_message', ({ ticketId, message }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    // Store message
    db.run("INSERT INTO messages(ticketId, sender, message) VALUES (?, ?, ?)", [ticketId, user.username, message]);

    // Send message to user and admins connected to this ticket room
    io.to(`ticket_${ticketId}`).emit('new_message', { sender: user.username, message, timestamp: new Date() });

    // Send to all admins also (they can listen to all tickets)
    if (!user.isAdmin) {
      io.sockets.sockets.forEach((sock) => {
        const u = connectedUsers.get(sock.id);
        if (u && u.isAdmin) sock.emit('new_message', { sender: user.username, message, timestamp: new Date(), ticketId });
      });
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
