// File utama, menghubungkan semua modul dan event
// Pastikan urutan script di index.html: firebase-config.js, utils.js, auth.js, voting.js, admin.js, main.js

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

  // Jika user login sebagai pemilih, tampilkan kandidat
  if (auth.currentUser && auth.currentUser.email !== ADMIN_EMAIL) {
    loadCandidates();
  }
});
