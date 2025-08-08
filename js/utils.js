// Fungsi utilitas global
function show(el) {
  if (el) el.classList.remove("hidden");
}
function hide(el) {
  if (el) el.classList.add("hidden");
}
function showMessage(msg, cls) {
  const messageContainer = document.getElementById("message-container");
  if (!messageContainer) return;
  messageContainer.textContent = msg;
  messageContainer.className = `mt-6 text-center ${cls}`;
}
