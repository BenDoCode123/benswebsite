
async function fetchMessages() {
  const res = await fetch("chat/fetch.php");
  const data = await res.text();
  document.getElementById("chat-box").innerHTML = data;
}

document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = document.getElementById("user").value.trim();
  const message = document.getElementById("message").value.trim();
  if (!user || !message) return;
  await fetch("chat/post.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "user=" + encodeURIComponent(user) + "&message=" + encodeURIComponent(message)
  });
  document.getElementById("message").value = "";
  fetchMessages();
});

setInterval(fetchMessages, 2000);
fetchMessages();
