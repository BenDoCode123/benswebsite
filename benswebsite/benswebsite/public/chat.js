const socket = io();

const chatToggle = document.getElementById('chat-toggle');
const chatBox = document.getElementById('chat-box');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const loginBtn = document.getElementById('login-btn');
const loginSection = document.getElementById('login-section');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginSubmit = document.getElementById('login-submit');
const loginError = document.getElementById('login-error');

let isAdmin = false;

chatToggle.addEventListener('click', () => {
  chatBox.classList.toggle('hidden');
});

loginBtn.addEventListener('click', () => {
  loginSection.classList.toggle('hidden');
});

loginSubmit.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if(username === 'Ben' && password === '7453'){
    isAdmin = true;
    loginSection.classList.add('hidden');
    loginError.textContent = '';
    loginBtn.style.display = 'none';
    chatInput.placeholder = "Admin: Type your message...";
    alert("Logged in as Ben (admin)");
    // Reconnect socket as admin
    socket.disconnect();
    window.socket = io({ query: "admin=true" });
    setupAdminSocket(window.socket);
  } else {
    loginError.textContent = "Invalid credentials";
  }
});

function setupAdminSocket(adminSocket){
  adminSocket.on('chat-history', (msgs) => {
    messages.innerHTML = '';
    msgs.forEach(appendMessage);
  });

  adminSocket.on('new-message', (msg) => {
    appendMessage(msg);
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(chatInput.value.trim()){
      adminSocket.emit('send-message', { message: chatInput.value });
      chatInput.value = '';
    }
  });
}

function appendMessage(msg){
  const div = document.createElement('div');
  div.classList.add('message');
  div.classList.add(msg.username === 'Ben' ? 'admin' : 'guest');
  const time = new Date(msg.timestamp).toLocaleTimeString();
  div.innerHTML = `<span class="username">${msg.username}</span>: ${msg.message} <span class="time">(${time})</span>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

socket.on('new-message', (msg) => {
  appendMessage(msg);
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if(chatInput.value.trim()){
    socket.emit('send-message', { message: chatInput.value });
    chatInput.value = '';
  }
});