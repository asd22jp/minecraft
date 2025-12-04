const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// ルーム状態管理
const rooms = {}; // { roomId: { hostId: string, players: [id] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      // 新規ルーム作成（ホスト）
      rooms[roomId] = { hostId: socket.id, players: [socket.id] };
      socket.emit("role-assigned", { role: "HOST" });
      console.log(`Room ${roomId} created by ${socket.id}`);
    } else {
      // 既存ルーム参加（クライアント）
      rooms[roomId].players.push(socket.id);
      socket.emit("role-assigned", {
        role: "CLIENT",
        hostId: rooms[roomId].hostId,
      });
      // ホストに接続要求を通知
      io.to(rooms[roomId].hostId).emit("user-joined", { userId: socket.id });
      console.log(`User ${socket.id} joined room ${roomId}`);
    }
  });

  // WebRTC シグナリング (Offer, Answer, ICE Candidate)
  socket.on("signal", (data) => {
    // data: { target: targetSocketId, signal: sdp/ice }
    io.to(data.target).emit("signal", {
      sender: socket.id,
      signal: data.signal,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const pIndex = room.players.indexOf(socket.id);
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);

        if (socket.id === room.hostId) {
          // ホストが切断された場合
          console.log(`Host ${socket.id} left room ${roomId}. Migrating...`);
          if (room.players.length > 0) {
            // 次のホストを選出（一番古いプレイヤー）
            const newHostId = room.players[0];
            room.hostId = newHostId;
            io.to(roomId).emit("host-migrated", { newHostId });
            io.to(newHostId).emit("role-assigned", { role: "HOST" });
          } else {
            delete rooms[roomId];
          }
        } else {
          // クライアントが切断 -> ホストに通知
          io.to(room.hostId).emit("user-left", { userId: socket.id });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
