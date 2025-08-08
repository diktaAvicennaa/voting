document.addEventListener("DOMContentLoaded", () => {
  // --- KONFIGURASI FIREBASE ---
  // GANTI DENGAN KONFIGURASI DARI PROYEK FIREBASE ANDA
  const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef1234567890",
  };

  // --- PENGATURAN ADMIN ---
  // GANTI DENGAN USER UID ADMIN DARI FIREBASE CONSOLE ANDA
  const ADMIN_UIDS = ["GANTI_DENGAN_UID_ADMIN_ANDA"];

  // Inisialisasi Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage(); // Inisialisasi Storage

  // --- REFERENSI ELEMEN DOM ---
  const loader = document.getElementById("loader");
  const loginContainer = document.getElementById("login-container");
  const votingContainer = document.getElementById("voting-container");
  const adminContainer = document.getElementById("admin-container");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const userEmailDisplay = document.getElementById("user-email");
  const logoutButton = document.getElementById("logout-button");
  const adminButton = document.getElementById("admin-button");
  const backToVoteButton = document.getElementById("back-to-vote-button");
  const candidateList = document.getElementById("candidate-list");
  const messageContainer = document.getElementById("message-container");

  // Elemen Admin Baru
  const addCandidateForm = document.getElementById("add-candidate-form");
  const addCandidateError = document.getElementById("add-candidate-error");
  const addCandidateButton = document.getElementById("add-candidate-button");
  const adminCandidateList = document.getElementById("admin-candidate-list");
  const voteChartCanvas = document.getElementById("voteChart").getContext("2d");

  let currentUserId = null;
  let resultsListener = null;
  let adminListener = null;
  let voteChart = null;

  // --- FUNGSI-FUNGSI UTAMA ---

  /**
   * Menampilkan pesan di halaman voting
   */
  function showMessage(text, type = "info") {
    messageContainer.innerHTML = "";
    const message = document.createElement("div");
    message.textContent = text;
    message.className = "p-4 rounded-lg fade-in";
    if (type === "success")
      message.classList.add("bg-green-100", "text-green-800");
    else if (type === "error")
      message.classList.add("bg-red-100", "text-red-800");
    else message.classList.add("bg-blue-100", "text-blue-800");
    messageContainer.appendChild(message);
  }

  /**
   * Memeriksa apakah pengguna sudah pernah memilih
   */
  async function checkHasVoted() {
    if (!currentUserId) return false;
    const voterDoc = await db.collection("voters").doc(currentUserId).get();
    return voterDoc.exists;
  }

  /**
   * Mengambil dan menampilkan daftar kandidat untuk pemilih
   */
  async function fetchAndDisplayCandidates() {
    candidateList.innerHTML =
      '<div class="text-center col-span-full"><i class="fas fa-spinner fa-spin"></i></div>';
    const hasVoted = await checkHasVoted();

    if (hasVoted) {
      showMessage("Terima kasih, Anda sudah memberikan suara.", "success");
    }

    try {
      const snapshot = await db.collection("kandidat").orderBy("nomor").get();
      candidateList.innerHTML = "";
      if (snapshot.empty) {
        candidateList.innerHTML =
          '<p class="text-center col-span-full text-gray-500">Belum ada kandidat yang terdaftar.</p>';
        return;
      }
      snapshot.forEach((doc) => {
        const candidate = doc.data();
        const card = document.createElement("div");
        card.className =
          "candidate-card border-2 bg-white border-gray-200 p-4 rounded-lg flex flex-col items-center text-center transition duration-300 hover:shadow-md";

        card.innerHTML = `
                  <div class="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden flex items-center justify-center">
                      <img src="${
                        candidate.fotoUrl ||
                        "https://placehold.co/150x150/E2E8F0/4A5568?text=Foto"
                      }" alt="Foto ${
          candidate.nama
        }" class="w-full h-full object-cover">
                  </div>
                  <p class="font-bold text-2xl text-blue-600">${
                    candidate.nomor
                  }</p>
                  <h3 class="font-bold text-lg text-gray-800 my-1">${
                    candidate.nama
                  }</h3>
                  <button data-id="${
                    doc.id
                  }" class="vote-button mt-4 w-full bg-green-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                      Pilih
                  </button>
              `;

        candidateList.appendChild(card);
        if (hasVoted) {
          card.querySelector(".vote-button").disabled = true;
        }
      });

      document
        .querySelectorAll(".vote-button")
        .forEach((button) => button.addEventListener("click", handleVote));
    } catch (error) {
      console.error("Error fetching candidates: ", error);
      candidateList.innerHTML =
        '<p class="text-center col-span-full text-red-500">Gagal memuat kandidat.</p>';
    }
  }

  /**
   * Menangani logika saat tombol vote diklik
   */
  async function handleVote(e) {
    const candidateId = e.target.dataset.id;
    if (
      !confirm(
        "Apakah Anda yakin ingin memilih kandidat ini? Pilihan tidak dapat diubah."
      )
    )
      return;

    document
      .querySelectorAll(".vote-button")
      .forEach((btn) => (btn.disabled = true));
    showMessage("Memproses suara Anda...", "info");

    try {
      if (await checkHasVoted()) {
        showMessage("Anda sudah pernah memberikan suara sebelumnya.", "error");
        return;
      }

      await db.runTransaction(async (transaction) => {
        const candidateRef = db.collection("kandidat").doc(candidateId);
        const voterRef = db.collection("voters").doc(currentUserId);
        const candidateDoc = await transaction.get(candidateRef);
        if (!candidateDoc.exists) throw "Kandidat tidak ditemukan!";
        const newVoteCount = (candidateDoc.data().suara || 0) + 1;
        transaction.update(candidateRef, { suara: newVoteCount });
        transaction.set(voterRef, { votedAt: new Date() });
      });

      showMessage("Suara Anda berhasil direkam! Terima kasih.", "success");
      fetchAndDisplayCandidates();
    } catch (error) {
      console.error("Error casting vote:", error);
      showMessage(
        "Terjadi kesalahan saat menyimpan suara. Coba lagi.",
        "error"
      );
      document
        .querySelectorAll(".vote-button")
        .forEach((btn) => (btn.disabled = false));
    }
  }

  // --- FUNGSI-FUNGSI ADMIN ---

  /**
   * [ADMIN] Menampilkan daftar kandidat di panel admin
   */
  function displayAdminCandidates() {
    if (adminListener) adminListener();
    adminListener = db
      .collection("kandidat")
      .orderBy("nomor")
      .onSnapshot((snapshot) => {
        adminCandidateList.innerHTML = "";
        if (snapshot.empty) {
          adminCandidateList.innerHTML =
            '<p class="text-gray-500">Belum ada kandidat.</p>';
          return;
        }
        snapshot.forEach((doc) => {
          const candidate = doc.data();
          const item = document.createElement("div");
          item.className =
            "flex items-center justify-between bg-white p-2 rounded-md";
          item.innerHTML = `
                  <div class="flex items-center">
                      <img src="${candidate.fotoUrl}" class="w-10 h-10 rounded-full object-cover mr-3">
                      <div>
                          <p class="font-bold">${candidate.nomor}. ${candidate.nama}</p>
                          <p class="text-xs text-gray-500">Suara: ${candidate.suara}</p>
                      </div>
                  </div>
                  <button data-id="${doc.id}" data-photopath="${candidate.fotoPath}" class="delete-candidate-button text-red-500 hover:text-red-700">
                      <i class="fas fa-trash"></i>
                  </button>
              `;
          adminCandidateList.appendChild(item);
        });
        document
          .querySelectorAll(".delete-candidate-button")
          .forEach((btn) =>
            btn.addEventListener("click", handleDeleteCandidate)
          );
      });
  }

  /**
   * [ADMIN] Menangani penambahan kandidat baru
   */
  async function handleAddCandidate(e) {
    e.preventDefault();
    addCandidateError.textContent = "";
    addCandidateButton.disabled = true;
    addCandidateButton.querySelector("span").textContent = "Mengupload...";

    const nomor = addCandidateForm["candidate-number"].value;
    const nama = addCandidateForm["candidate-name"].value;
    const photoFile = addCandidateForm["candidate-photo"].files[0];

    if (!nomor || !nama || !photoFile) {
      addCandidateError.textContent = "Semua field harus diisi.";
      addCandidateButton.disabled = false;
      addCandidateButton.querySelector("span").textContent = "Tambah";
      return;
    }

    try {
      // Upload foto ke Firebase Storage
      const filePath = `kandidat/${Date.now()}_${photoFile.name}`;
      const fileRef = storage.ref(filePath);
      await fileRef.put(photoFile);
      const fotoUrl = await fileRef.getDownloadURL();

      // Simpan data ke Firestore
      await db.collection("kandidat").add({
        nomor: parseInt(nomor),
        nama: nama,
        fotoUrl: fotoUrl,
        fotoPath: filePath, // Simpan path untuk penghapusan
        suara: 0,
      });

      addCandidateForm.reset();
    } catch (error) {
      console.error("Error adding candidate:", error);
      addCandidateError.textContent = "Gagal menambahkan kandidat.";
    } finally {
      addCandidateButton.disabled = false;
      addCandidateButton.querySelector("span").textContent = "Tambah";
    }
  }

  /**
   * [ADMIN] Menangani penghapusan kandidat
   */
  async function handleDeleteCandidate(e) {
    const button = e.currentTarget;
    const candidateId = button.dataset.id;
    const photoPath = button.dataset.photopath;

    if (
      !confirm(
        "Yakin ingin menghapus kandidat ini? Aksi ini tidak dapat dibatalkan."
      )
    )
      return;

    try {
      // Hapus dokumen dari Firestore
      await db.collection("kandidat").doc(candidateId).delete();
      // Hapus foto dari Storage
      if (photoPath) {
        await storage.ref(photoPath).delete();
      }
    } catch (error) {
      console.error("Error deleting candidate:", error);
      alert("Gagal menghapus kandidat.");
    }
  }

  /**
   * [ADMIN] Menampilkan hasil voting dan diagram
   */
  function fetchAndDisplayResults() {
    if (resultsListener) resultsListener();

    resultsListener = db
      .collection("kandidat")
      .orderBy("nomor")
      .onSnapshot(
        (snapshot) => {
          const labels = [];
          const data = [];

          snapshot.forEach((doc) => {
            const candidate = doc.data();
            labels.push(`${candidate.nomor}. ${candidate.nama}`);
            data.push(candidate.suara);
          });

          // Inisialisasi atau update chart
          if (voteChart) {
            voteChart.data.labels = labels;
            voteChart.data.datasets[0].data = data;
            voteChart.update();
          } else {
            voteChart = new Chart(voteChartCanvas, {
              type: "bar",
              data: {
                labels: labels,
                datasets: [
                  {
                    label: "Jumlah Suara",
                    data: data,
                    backgroundColor: "rgba(59, 130, 246, 0.5)",
                    borderColor: "rgba(59, 130, 246, 1)",
                    borderWidth: 1,
                  },
                ],
              },
              options: {
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                },
                responsive: true,
                plugins: { legend: { display: false } },
              },
            });
          }
        },
        (error) => {
          console.error("Error fetching results:", error);
        }
      );
  }

  // --- LOGIKA AUTENTIKASI & NAVIGASI ---

  auth.onAuthStateChanged((user) => {
    loader.style.display = "none";

    // Hentikan semua listener jika pengguna logout
    if (!user) {
      if (resultsListener) {
        resultsListener();
        resultsListener = null;
      }
      if (adminListener) {
        adminListener();
        adminListener = null;
      }
      if (voteChart) {
        voteChart.destroy();
        voteChart = null;
      }

      currentUserId = null;
      loginContainer.style.display = "block";
      votingContainer.style.display = "none";
      adminContainer.style.display = "none";
      adminButton.style.display = "none";
    } else {
      currentUserId = user.uid;
      loginContainer.style.display = "none";
      votingContainer.style.display = "block";
      adminContainer.style.display = "none";
      userEmailDisplay.textContent = `Login sebagai: ${user.email}`;
      fetchAndDisplayCandidates();

      if (ADMIN_UIDS.includes(user.uid)) {
        adminButton.style.display = "block";
      } else {
        adminButton.style.display = "none";
      }
    }
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm["email"].value;
    const password = loginForm["password"].value;
    loginError.textContent = "";
    auth.signInWithEmailAndPassword(email, password).catch((error) => {
      loginError.textContent = "ID Pemilih atau Password salah.";
    });
  });

  logoutButton.addEventListener("click", () => auth.signOut());

  adminButton.addEventListener("click", () => {
    votingContainer.style.display = "none";
    adminContainer.style.display = "block";
    fetchAndDisplayResults();
    displayAdminCandidates();
  });

  backToVoteButton.addEventListener("click", () => {
    adminContainer.style.display = "none";
    votingContainer.style.display = "block";
    if (resultsListener) {
      resultsListener();
      resultsListener = null;
    }
    if (adminListener) {
      adminListener();
      adminListener = null;
    }
    if (voteChart) {
      voteChart.destroy();
      voteChart = null;
    }
  });

  addCandidateForm.addEventListener("submit", handleAddCandidate);
});
