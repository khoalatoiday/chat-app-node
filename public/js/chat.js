const socket = io(); // method được support trong file socket.io.js
const $messageForm = document.getElementById("message-form");
const $messageInput = $messageForm.querySelector("input");
const $messageBtn = $messageForm.querySelector("button");
const $locationSendBtn = document.getElementById("send-location");
const $messages = document.querySelector("#messages");


// Template
const $messageLocationTemplate = document.querySelector(
  "#message-location-template"
).innerHTML;
const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Option
// QS.parse() trả về 1 Object của Query, ignoreQueryPrefix: true -> bỏ dấu ? ở đầu câu Query
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () =>{
  // tin nhắn gần nhất
  const $newMessage = $messages.lastElementChild

  // lấy chiều cao của tin nhắn gần nhất
  const newMessageStyle = getComputedStyle($newMessage) // lấy style của element được chọn
  const newMessageMarginBottom = parseInt(newMessageStyle.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMarginBottom// offsetHeight chưa tính margin

  // chiều cao đang hiển thị 
  const visiableHeight = $messages.offsetHeight

  // chiều cao của toàn bộ messages( bao gồm phần hiển thị và phần không hiển thị)
  const containerHeight = $messages.scrollHeight

  // độ dài từ top -> bottom của visible client
  const scrollOffSet =  $messages.scrollTop + visiableHeight

  if(containerHeight - newMessageHeight <=scrollOffSet){ // điều kiện đang ở bottom rồi
    $messages.scrollTop = $messages.scrollHeight // đẩy về bottom
  }

}

socket.on("sendMessage", (input) => {
  console.log(input);
  const html = Mustache.render($messageTemplate, {
    username: input.username,
    message: input.text,
    createAt: moment(input.createAt).format("hh:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll()
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // sau khi gửi tin thì disable button
  $messageBtn.setAttribute("disabled", "disabled");

  const input = e.target.elements.message; // e.target = $messageForm -> $messageForm.elements.nameOfElement
  socket.emit("sendMessage", input.value, (error) => {
    if (error) {
      $messageBtn.removeAttribute("disabled");
      $messageInput.value = "";
      return console.log(error);
    }

    // nếu server nhận được tin nhắn thì enable lại button
    $messageBtn.removeAttribute("disabled");
    $messageInput.value = "";
    //$messageInput.focus() // giống dòng trên

    console.log("This message is delivery!");
  });
});

socket.on("roomData",({room,users})=>{
  const html = Mustache.render($sidebarTemplate,{
    room,
    users,
  })
  document.querySelector("#sidebar").innerHTML = html
})

// Vị trí??????? -> sắp xếp: code nhận event trước code gửi event
socket.on("locationMessage", (messLocation) => {
  const html = Mustache.render($messageLocationTemplate, {
    username: messLocation.username,
    messagelocation: messLocation.url,
    createAt: moment(messLocation.createAt).format("hh:mm a"),
    location: `${messLocation.username}'s location`
  });
  $messages.insertAdjacentHTML("beforeend", html);
  console.log(messLocation);
  autoScroll()
});

$locationSendBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("this browser doesn't support geolocation");
  }

  // $locationSendBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position);
    socket.emit(
      "sendLocation",
      {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      },
      () => {
        // sau khi gửi location thành công thì enable lại button
        $locationSendBtn.removeAttribute("disabled");
        console.log("Location shared!");
      }
    );
  });
});



socket.emit("join", {username,room},(error)=>{
  if(error){
    alert(`${username} has been use in ${room}`)
    location.href = '/'; // quay về index.html
  }
})


// socket.on("countUpdated",(count)=>{
//     console.log("The count Update is ", count)
// })

// document.getElementById("increment-id").addEventListener("click",()=>{
//     console.log("Click")
//     socket.emit("increment")
// })

/*
  Mustache: dùng để render template lên HTML (dùng cho JS)
  moment: thư viện thứ 3 chứa các hàm xử lý thời gian có s
  QueryString(QS): xử lý câu lệnh Query
*/
