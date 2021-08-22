const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  getUser,
  getUserInRoom,
  addUser,
  removeUser,
} = require("./utils/users");

// import các function
const { generateMessage, generateLocationMessage } = require("./utils/message");

const app = express();
const server = http.createServer(app);
const io = socketio(server); // input là một raw http server

const port = process.env.PORT || 3000;

const publicDirectionPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectionPath)); // serve các file tĩnh

let count = 0;

// thiết lập bên server side
// client(emit) -> server(recieve) - connection
// server(emit) -> client(recieve) - countUpdate
// client(emit) -> server(recieve) - increment
io.on("connection", (socket) => {
  // console.log("New socketIO connection")
  const filter = new Filter();

  socket.on("sendMessage", (input, callback) => {
    if (filter.isProfane(input)) {
      return callback("Profanity is not allowed!");
    }

    const user = getUser(socket.id)
    

    io.to(user.room).emit("sendMessage", generateMessage(user.username,input));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  // input là 1 var hoặc 1 Object
  socket.on("join", ({ username, room }, callback) => {
    //console.log(username + " " + room)

    const { error, user } = addUser({
      id: socket.id,
      username: username,
      room: room,
    });

    // console.log(error)

    // validate data của user
    if (error) {
      return callback(error);
    }


    socket.join(user.room); // tham gia room cụ thể
    socket.emit("sendMessage", generateMessage("Admin",`Welcome ${user.username}`)); // name of event/ data
    socket.broadcast
      .to(user.room)
      .emit("sendMessage", generateMessage("Admin",`${user.username} has join`)); // ngoài client hiện tại thì các client khác đều nhận event
    
    io.to(user.room).emit("roomData",{
      room: user.room,
      users: getUserInRoom(user.room)
    })
      callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "sendMessage",
        generateMessage("Admin",`${user.username} has left the room`)
      );
      io.to(user.room).emit("roomData",{
        room: user.room,
        users: getUserInRoom(user.room)
      })
    }
  });
});

// khi truy cập vào server, nó sẽ tìm file index.html nếu có
server.listen(port, () => {
  console.log("Serve up in " + port);
});

/*
    web socket: 
    -là 1 giao thức cho phép full-duplex communication(kết nối 2 chiều)
    -là 1 giao thức tách riêng HTTP
    -thiết lập kết nối duy trì giữa client và server do đó client có thể gửi data cho server và ngược lại
    server có thể gửi data cho client chừng nào kết nối còn duy trì
    library: Socket.IO 

    server(emit) -> client(recieve)

    broadcast: server gửi event tới các client ngoài trừ client hiện tại
    broadcast không hỗ trợ callback function

    acknowledgement event: hàm thông báo cho client hoặc server gửi event rằng đã xác nhận bên còn lại nhận được event,
    là agru cuối của emit() và là 1 callback function
    server(emit) -> client(recieve) -- acknowledgement -> server biết client đã nhận được event
    client(emit) -> server(recieve) -- acknowledgement -> client biết server đã nhận được event

    io.to(...).emit(): gửi event đến tất cả client trong 1 room cụ thể
    socket.to.emit(): gửi event đến 1 client trong 1 room cụ thể
    socket.broadcast.to(...).emit(): gửi event đến các client tromg 1 room cụ thể ngoài trừ client hiện tại

*/

// socket.emit("countUpdated", count)

// socket.on("increment",()=>{
//     count++
//     //socket.emit("countUpdated",count) // chỉ gửi event cho 1 client cụ thể
//     io.emit('countUpdated', count) // gửi event cho tất cả client
// })
