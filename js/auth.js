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

function setupAuthEvents() {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutButton = document.getElementById("logout-button");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (loginError) loginError.textContent = "";
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      auth.signInWithEmailAndPassword(email, password).catch(() => {
        if (loginError) loginError.textContent = "ID atau password salah!";
      });
    });
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      auth.signOut();
    });
  }
}
