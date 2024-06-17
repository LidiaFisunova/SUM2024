import { b } from "./ii.js";

console.log("f,ow");
b();

setInterval(async () => {
  const response = await fetch("/getData");
  const text = await response.text();

  const elem = document.getElementById("dataField");
  elem.textContent = text;
}, 1000);

function initializeCommunication() {
  let socket = new WebSocket("ws://localhost:8000");

  socket.onopen = () => {
    console.log("socket is opened");
    socket.send("hello from client");
  };

  socket.onmessage = (event) => {
    console.log(`message received: ${event.data}`);
  };
}

initializeCommunication();