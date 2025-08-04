const socket = io();

document.getElementById("chat-icon").onclick = () => {
  document.getElementById("chat-box").classList.toggle("hidden");
};

function sendMessage() {
  const msg = document.getElementById("msg").value;
  socket.emit("message", msg);
  document.getElementById("msg").value = "";
}

socket.on("message", ({ user, msg, timestamp }) => {
  const div = document.createElement("div");
  div.textContent = `[${timestamp}] ${user}: ${msg}`;
  document.getElementById("messages").appendChild(div);
});

function login() {
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;
  socket.emit("login", { name, password });
}

socket.on("login-success", () => {
  alert("Logged in as Ben!");
  document.getElementById("admin-panel").classList.remove("hidden");
});

socket.on("login-failed", () => {
  alert("Login failed!");
});

function getMessages() {
  socket.emit("get-messages");
}

socket.on("all-messages", (rows) => {
  const panel = document.getElementById("admin-messages");
  panel.innerHTML = "";
  rows.forEach(({ name, message, time }) => {
    const p = document.createElement("p");
    p.textContent = `[${time}] ${name}: ${message}`;
    panel.appendChild(p);
  });
});
