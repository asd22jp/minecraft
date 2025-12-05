const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// publicフォルダを静的ファイルとして配信
app.use(express.static(path.join(__dirname, "public")));

// 部屋ごとの情報を保持（ホストが誰かなど）
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. 部屋への参加処理
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    // 部屋が存在しない場合はそのユーザーをホストにする
    if (!rooms[roomId]) {
      rooms[roomId] = { hostId: socket.id, players: [socket.id] };
      socket.emit("role-assigned", { role: "HOST" });
      console.log(`Room ${roomId} created by ${socket.id} (HOST)`);
    } else {
      // 既存の部屋ならクライアントとして追加
      rooms[roomId].players.push(socket.id);
      socket.emit("role-assigned", {
        role: "CLIENT",
        hostId: rooms[roomId].hostId,
      });
      // ホストに「新しい人が来たからP2P接続を開始して」と通知
      io.to(rooms[roomId].hostId).emit("user-joined", { userId: socket.id });
      console.log(`User ${socket.id} joined room ${roomId} (CLIENT)`);
    }
  });

  // 2. シグナリング処理 (P2P接続のための情報交換のみ)
  // ゲームデータはここを通らず、WebRTC DataChannelを通ります
  socket.on("signal", (data) => {
    io.to(data.target).emit("signal", {
      sender: socket.id,
      signal: data.signal,
    });
  });

  // 3. 切断時の処理 (ホスト移行など)
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const rId in rooms) {
      const room = rooms[rId];
      const idx = room.players.indexOf(socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);

        // ホストが落ちた場合
        if (socket.id === room.hostId) {
          if (room.players.length > 0) {
            // 次のプレイヤーをホストに昇格
            room.hostId = room.players[0];
            io.to(rId).emit("host-migrated", { newHostId: room.hostId });
            io.to(room.hostId).emit("role-assigned", { role: "HOST" });
            console.log(`Host migrated to ${room.hostId} in room ${rId}`);
          } else {
            // 誰もいなくなったら部屋を削除
            delete rooms[rId];
            console.log(`Room ${rId} deleted`);
          }
        } else {
          // クライアントが落ちた場合、ホストに通知（P2P切断処理用）
          io.to(room.hostId).emit("user-left", { userId: socket.id });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
