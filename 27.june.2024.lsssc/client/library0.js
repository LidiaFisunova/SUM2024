function main() {
  const elem = document.getElementById("text");

  const result = window.localStorage.getItem("element", elem.textContent);
  if (result) elem.textContent = result;
}

function onClick() {
  const elem = document.getElementById("input");

  window.localStorage.setItem("element", elem.value);
  console.log("you clicked button");
}
window.onload = main;
