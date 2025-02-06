console.log("Starting server...");

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");
const path = require("path");

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://127.0.0.1:5500",  
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'views'))); 
app.use("/api/auth", authRoutes);

const users = {}; 

io.on('connection', (socket) => {
    console.log('a user connected');
    
    socket.emit('updateUserList', Object.keys(users));

    socket.on('joinRoom', async ({ username, room, messageType }) => {
        socket.username = username; 
        users[username] = socket.id; 

        socket.join(room); 
        console.log(`${username} joined room: ${room} for ${messageType}`);

        
        io.to(room).emit('roomMessage', {
            from_user: "System",
            message: `${username} has joined the room.`,
            type: messageType
        });

        
        io.emit("usersList", Object.keys(users));
    });

    
    socket.on('sendMessage', async ({ username, room, message, messageType, to_user }) => {
        
        if (messageType === 'group') {
            const newMessage = new GroupMessage({
                from_user: username,
                room,
                message
            });

            await newMessage.save();

            io.to(room).emit('receiveMessage', {
                from_user: username,
                room,
                message
            });
        }

        
        if (messageType === 'private' && to_user) {
            const newMessage = new PrivateMessage({
                from_user: username,
                to_user,
                message
            });

            await newMessage.save();

            io.to(users[to_user]).emit('receiveMessage', {
                from_user: username,
                to_user,
                message
            });
        }
    });

    
    socket.on("typing", ({ username, room, messageType }) => {
        socket.to(room).emit("userTyping", { username });
    });

    
    socket.on("disconnect", () => {
        console.log(`${socket.username} disconnected`);
        delete users[socket.username]; 
        io.emit("usersList", Object.keys(users)); 
    });
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html")); 
});
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html")); 
});

app.get("/signup.html", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signup.html")); 
});

app.get("/chat.html", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "chat.html")); 
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
