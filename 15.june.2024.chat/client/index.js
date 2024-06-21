import { b } from "./ii.js";

console.log("f,ow");
b();
/*
setInterval(async () => {
  const response = await fetch("/getData");
  const text = await response.text();

  const elem = document.getElementById("dataField");
  elem.textContent = text;
}, 1000);
*/
let socket = new WebSocket("ws://localhost:8000");

function initializeCommunication() {
  socket.onopen = () => {
    console.log("socket is opened");
    socket.send("hello from client");
  };

  socket.onmessage = async (event) => {
    const response = await fetch("/getData");
    const text = await response.text();

    const elem = document.getElementById("dataField");
    elem.textContent = text;
    console.log(`message received: ${event.data}`);
  };
}

initializeCommunication();

$(document).ready(function() {
  let nic, o;

  nic = $("#nic").val;
  socket.onmessage = async (event) => {
    const response = await fetch("/getData");
    const text = await response.text();

    const elem = document.getElementById("dataField");
    elem.textContent = text;
    console.log(`message received: ${event.data}`);
  };

})