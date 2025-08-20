// js/main.js (VERSI FINAL YANG BENAR)

document.addEventListener("DOMContentLoaded", function () {
  // Setup event dan auth listener
  handleAuthState();
  setupAuthEvents();

  // Tombol admin dan kembali ke voting
  const adminButton = document.getElementById("admin-button");
  const backToVoteButton = document.getElementById("back-to-vote-button");

  if (adminButton) {
    adminButton.addEventListener("click", function () {
      hide(document.getElementById("voting-container"));
      show(document.getElementById("admin-container"));
      loadAdminDashboard();
    });
  }

  if (backToVoteButton) {
    backToVoteButton.addEventListener("click", function () {
      show(document.getElementById("voting-container"));
      hide(document.getElementById("admin-container"));
    });
  }

  // Blok kode yang memicu error sebelumnya sudah dihapus dari sini.
});
