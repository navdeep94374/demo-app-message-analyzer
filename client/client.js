const socket = io();
const messageSec = document.querySelector(".message_sec");
const messageText = document.querySelector("textarea");
const sendBtn = document.querySelector("#sendMsg");
const send_img = document.querySelector("#send_img")
const file_input = document.querySelector("#file_input")
let name = prompt("enter your name");

// new user msg
socket.emit("user-joined", name);

const date = new Date();
const hours = date.getHours();
const min = date.getMinutes();
let dt = `${hours} : ${min} AM`;
if (hours == 12) {
  dt = `${hours} : ${min} PM`;
}
if (hours > 12) {
  dt = `${hours - 12} : ${min} PM`;
}

// append user join msg
socket.on("user-joined-msg", (name) => {
  appendInfoMsg(`${name} joined chat`);
});

const sendMsg = (type,image=null) => {
  if (!name) {
    name = prompt("enter your name");
  }

  const message = {
    msg: type === "text" ? messageText.value : image,
    user: name,
    timestamp: dt,
    type
  };

  // sending message : sendMsg event
  socket.emit("sendMsg", message);
  const isImage = type === "file";
  appendMsg(message, "outgoingMsg",isImage);
  messageText.value = "";
};

sendBtn.addEventListener("click", () => {
  sendMsg();
});

window.addEventListener("keydown", (key) => {
  if (key.code === "Enter") {
    sendMsg("text");
  }
});

//aapend chat msg
const appendMsg = (message, type,isImage) => {
  const msgElem = document.createElement("div");
  msgElem.classList.add("message", type);

 if(!isImage){
  const html = `
  <p>${message.user}</p>
  <p>
    ${message.msg}
  </p>
  <p id="timestamp">${dt}</p>
`;

msgElem.innerHTML = html;
messageSec.appendChild(msgElem);
 }else{
  const html = `
  <p>${message.user}</p>
  <img src=${message.msg} width="200px" />
  <p id="timestamp">${dt}</p>
`;

msgElem.innerHTML = html;
messageSec.appendChild(msgElem);
 }
};

// append info msg
const appendInfoMsg = (message) => {
  const msgElem = document.createElement("div");
  msgElem.classList.add("infoMsg");

  const html = `
       <p>${message}</p>
  `;

  msgElem.innerHTML = html;
  messageSec.appendChild(msgElem);
};

// listening event broadcastMsg to all except sender
socket.on("broadcastMsg", (message) => {
  const isImage = message.type === "file";
  appendMsg(message, "incomingMsg",isImage);
});

// left chat msg
socket.on("left-chat", (name) => {
  appendInfoMsg(`${name} left chat`);
});

send_img.addEventListener("click",()=>{
  file_input.click()
})

file_input.addEventListener("change",async (e)=>{
  const file = e.target.files[0];
  
  if (file) {
    try{
      const formData = new FormData();
      formData.append("file",file);
      const res = await fetch("http://localhost:5000/upload",{
        method:"POST",
        body:formData
      })
      const data = await res.json()
      sendMsg("file",data.public_url)
    }catch(err){
      alert(err)
    }
  } else {
    alert("No file selected.");
  }
})