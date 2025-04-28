const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send the list of available rooms to the client
  socket.emit('availableRooms', Object.keys(rooms));

  // Handle user joining a room
  socket.on('joinRoom', ({ username, room }, callback) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }

    // Check if the username is already in use in the room
    if (rooms[room].includes(username)) {
      return callback({ error: 'Username is already in use in this room.' });
    }

    // Add the user to the room
    rooms[room].push(username);
    socket.join(room);

    // Notify the room about the new user
    io.to(room).emit('message', {
      user: 'System',
      text: `${username} has joined the room.`,
      time: new Date().toLocaleTimeString(),
    });
    io.to(room).emit('roomData', { room, users: rooms[room] });

    // Update the list of available rooms for all clients
    io.emit('availableRooms', Object.keys(rooms));

    callback(); 
  });

  // Handle user leaving a room
  socket.on('leaveRoom', ({ username, room }, callback) => {
    if (rooms[room]) {
      // Remove the user from the room
      rooms[room] = rooms[room].filter((user) => user !== username);

      // Notify the room about the user leaving
      io.to(room).emit('message', {
        user: 'System',
        text: `${username} has left the room.`,
        time: new Date().toLocaleTimeString(), // Add the current time
      });
      io.to(room).emit('roomData', { room, users: rooms[room] });

      // If the room is empty, delete it
      if (rooms[room].length === 0) {
        delete rooms[room];
      }

      // Update the list of available rooms for all clients
      io.emit('availableRooms', Object.keys(rooms));

      // Leave the room
      socket.leave(room);

      callback();
    }
  });

  // Handle user disconnecting
  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((user) => user !== socket.id);
      if (rooms[room].length === 0) {
        delete rooms[room]; 
      }
    }

    // Update the list of available rooms for all clients
    io.emit('availableRooms', Object.keys(rooms));
  });

  socket.on('sendMessage', ({ room, message, username }) => {
    if (room && message && username) {
      io.to(room).emit('message', {
        user: username,
        text: message,
        time: new Date().toLocaleTimeString(),
      });
    }
  });
});

server.listen(5500, () => {
  console.log('Server is running on http://localhost:5500');
});