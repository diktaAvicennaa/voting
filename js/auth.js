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

function showLoginError(message) {
  const errorDiv = document.getElementById("login-error");
  errorDiv.textContent = message;
  errorDiv.classList.add("error-shake");
  setTimeout(() => errorDiv.classList.remove("error-shake"), 500);
}

function setupAuthEvents() {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutButton = document.getElementById("logout-button");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const submitBtn = loginForm.querySelector("button[type=submit]");

      try {
        if (loginError) loginError.textContent = "";
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Masuk...
        `;

        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error("Login error:", error);
        showLoginError("ID atau password salah!");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span class="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </span>
          Masuk
        `;
      }
    });
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      auth.signOut();
    });
  }
}
