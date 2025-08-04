const socket = io({ query: "admin=true" });

const adminMessages = document.getElementById('adminMessages');
const adminForm = document.getElementById('adminForm');
const adminInput = document.getElementById('adminInput');

socket.emit('login-admin');

function appendAdminMessage(data) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.classList.add(data.username === 'Ben' ? 'admin' : 'guest');
  const time = new Date(data.timestamp).toLocaleTimeString();
  div.innerHTML = `<strong>${data.username}</strong>: ${data.message} <span class="time">${time}</span>`;
  adminMessages.appendChild(div);
  adminMessages.scrollTop = adminMessages.scrollHeight;
}

socket.on('chat-history', (messages) => {
  adminMessages.innerHTML = '';
  messages.forEach(appendAdminMessage);
});

socket.on('new-message', (data) => {
  appendAdminMessage(data);
});

adminForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (adminInput.value.trim()) {
    socket.emit('send-message', { message: adminInput.value });
    adminInput.value = '';
  }
});