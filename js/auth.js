// js/auth.js (VERSI FINAL YANG BENAR)

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
        loadAdminDashboard();
        if (adminButton) adminButton.style.display = "block";
      } else {
        hide(loginContainer);
        show(votingContainer);
        hide(adminContainer);
        hide(loader);
        if (userEmail) userEmail.textContent = user.email;
        if (adminButton) adminButton.style.display = "none";

        // --- INI PERBAIKANNYA: Kandidat dimuat SETELAH login pemilih dikonfirmasi ---
        loadCandidates();
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

// ... Sisa dari file ini (fungsi showLoginError dan setupAuthEvents) tidak perlu diubah ...

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
  const togglePasswordButton = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const submitBtn = loginForm.querySelector("button[type=submit]");
      const originalBtnHTML = submitBtn.innerHTML;
      try {
        if (loginError) loginError.textContent = "";
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Memproses...</span>`;
        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error("Login error:", error);
        showLoginError("ID atau password salah!");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    });
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      resetVotingUI();
      auth.signOut();
    });
  }
  if (togglePasswordButton) {
    togglePasswordButton.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      const icon = this.querySelector("i");
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  }
}
