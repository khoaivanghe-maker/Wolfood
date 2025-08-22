const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

// ====================== CẤU HÌNH DATABASE ======================
const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [], rooms: {} });

async function initDB() {
  await db.read();
  db.data ||= { users: [], rooms: {} };
  await db.write();
}
initDB();

// ====================== TẠO SERVER ======================
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Chứa file HTML, CSS, JS

// ====================== API ĐĂNG KÝ ======================
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Vui lòng nhập đủ thông tin!" });
  }

  // Kiểm tra username hoặc email đã tồn tại chưa
  const exists = db.data.users.find(
    (u) => u.username === username || u.email === email
  );
  if (exists) {
    return res
      .status(400)
      .json({ message: "Tên đăng nhập hoặc email đã tồn tại!" });
  }

  // Lưu người dùng mới
  db.data.users.push({ username, email, password });
  await db.write();

  return res.json({ message: "Đăng ký thành công!" });
});

// ====================== API ĐĂNG NHẬP ======================
app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Vui lòng nhập đủ thông tin!" });
  }

  // Tìm user theo username hoặc email
  const user = db.data.users.find(
    (u) =>
      (u.username === identifier || u.email === identifier) &&
      u.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ message: "Sai tên đăng nhập/email hoặc mật khẩu!" });
  }

  return res.json({
    message: "Đăng nhập thành công!",
    username: user.username,
  });
});

// ====================== SOCKET.IO ======================
io.on("connection", (socket) => {
  console.log(`🔗 Người chơi kết nối: ${socket.id}`);

  // Người chơi tham gia phòng
  socket.on("join_room", ({ roomId, playerName }) => {
    // Kiểm tra tên hợp lệ
    if (!playerName || playerName.trim() === "" || playerName.includes("node")) {
      return socket.emit("error_msg", "Tên không hợp lệ!");
    }

    // Nếu phòng chưa tồn tại → tạo mới
    if (!db.data.rooms[roomId]) {
      db.data.rooms[roomId] = [];
    }

    // Kiểm tra phòng đầy
    if (db.data.rooms[roomId].length >= 7) {
      return socket.emit("room_full");
    }

    // Lưu thông tin người chơi
    db.data.rooms[roomId].push({ id: socket.id, name: playerName });
    db.write();

    socket.join(roomId);

    // Gửi danh sách người chơi trong phòng cho tất cả
    io.to(roomId).emit("room_update", db.data.rooms[roomId]);
  });

  // Khi người chơi thoát
  socket.on("disconnect", () => {
    console.log(`❌ Người chơi rời: ${socket.id}`);

    // Xóa người chơi khỏi tất cả phòng
    for (const roomId in db.data.rooms) {
      const oldLength = db.data.rooms[roomId].length;

      db.data.rooms[roomId] = db.data.rooms[roomId].filter(
        (player) => player.id !== socket.id
      );

      // Nếu có thay đổi → cập nhật danh sách người chơi
      if (db.data.rooms[roomId].length !== oldLength) {
        io.to(roomId).emit("room_update", db.data.rooms[roomId]);
      }
    }

    db.write();
  });
});

// ====================== CHẠY SERVER ======================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

