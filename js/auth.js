// Logika autentikasi (login, logout, cek admin/pemilih)
// Pastikan sudah load firebase-config.js sebelum file ini

const ADMIN_EMAIL = "admin@voting.com"; // Ganti sesuai email admin Anda

function handleAuthState() {
  auth.onAuthStateChanged((user) => {
    const loader = document.getElementById("loader");
    const loginContainer = document.getElementById("login-container");
    const votingContainer = document.getElementById("voting-container");
    const adminContainer = document.getElementById("admin-container");
    const adminButton = document.getElementById("admin-button");
    const userEmail = document.getElementById("user-email");

    if (user) {
      if (user.email === ADMIN_EMAIL) {
        hide(loginContainer);
        hide(votingContainer);
        show(adminContainer);
        hide(loader);

        // Memastikan dashboard dimuat saat admin login
        loadAdminDashboard();

        if (adminButton) adminButton.style.display = "block";
      } else {
        hide(loginContainer);
        show(votingContainer);
        hide(adminContainer);
        hide(loader);
        if (userEmail) userEmail.textContent = user.email;
        if (adminButton) adminButton.style.display = "none";
      }
    } else {
      show(loginContainer);
      hide(votingContainer);
      hide(adminContainer);
      hide(loader);
      if (adminButton) adminButton.style.display = "none";
    }
  });
}

function showLoginError(message) {
  //... tidak ada perubahan ...
}

function setupAuthEvents() {
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");

  if (loginForm) {
    // ... tidak ada perubahan pada event listener form login ...
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      resetVotingUI();
      auth.signOut();
    });
  }

  // PENAMBAHAN LOGIKA UNTUK TOMBOL LIHAT PASSWORD
  const togglePasswordButton = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");

  if (togglePasswordButton) {
    togglePasswordButton.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      const icon = this.querySelector("i");
      if (type === "password") {
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      } else {
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      }
    });
  }
}
