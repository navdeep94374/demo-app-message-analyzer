require("dotenv").config()

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 5000;
const path = require("path");
const axios = require("axios");
const { upload } = require("./cloudinary")


// middleware
app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// upload route

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    success: true,
    public_url: req.file.path,
    public_id: req.file.filename,
  });

});

http.listen(port, () => {
  console.log(`server started at port ${port}`);
});

// socket connection
const io = require("socket.io")(http);

const users = {};

io.on("connection", (socket) => {
  // send new connection msg
  socket.on("user-joined", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("user-joined-msg", name);
  });
  
  // listening sendMsg event form client
  socket.on("sendMsg", async (msg) => {
    const type = msg.type;
    try {
      if (type === "text") {
        const res = await axios.post(`${process.env.MESSAGE_FILTER_BACKEND_URL}/filter-messages`, { msg: msg.msg })
        console.log(res.data)
        socket.broadcast.emit("broadcastMsg", { msg: res.data.msg, user: msg.user, timestamp: msg.timestamp });
      } else {
        const res = await axios.post(`${process.env.MESSAGE_FILTER_BACKEND_URL}/filter-image`, { image: msg.msg })
        console.log(res.data)
        socket.broadcast.emit("broadcastMsg", { msg: res.data.msg, user: msg.user, timestamp: msg.timestamp, type: "file" });
      }
    } catch (e) {
      // console.log(e)
      socket.broadcast.emit("broadcastMsg", { msg: e.message, user: msg.user, timestamp: msg.timestamp });
    }
  });

  // left chat
  socket.on("disconnect", () => {
    socket.broadcast.emit("left-chat", users[socket.id]);
  });
});
