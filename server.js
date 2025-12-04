const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { hostId: socket.id, players: [socket.id] };
      socket.emit("role-assigned", { role: "HOST" });
    } else {
      rooms[roomId].players.push(socket.id);
      socket.emit("role-assigned", {
        role: "CLIENT",
        hostId: rooms[roomId].hostId,
      });
      io.to(rooms[roomId].hostId).emit("user-joined", { userId: socket.id });
    }
  });

  socket.on("signal", (data) => {
    io.to(data.target).emit("signal", {
      sender: socket.id,
      signal: data.signal,
    });
  });

  socket.on("disconnect", () => {
    for (const rId in rooms) {
      const room = rooms[rId];
      const idx = room.players.indexOf(socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (socket.id === room.hostId) {
          if (room.players.length > 0) {
            room.hostId = room.players[0];
            io.to(rId).emit("host-migrated", { newHostId: room.hostId });
            io.to(room.hostId).emit("role-assigned", { role: "HOST" });
          } else {
            delete rooms[rId];
          }
        } else {
          io.to(room.hostId).emit("user-left", { userId: socket.id });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
