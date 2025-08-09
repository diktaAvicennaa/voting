// Fungsi-fungsi untuk pemilih (tampil kandidat, voting, cek sudah voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadCandidates() {
  const candidateList = document.getElementById("candidate-list");
  if (!candidateList) return;

  candidateList.innerHTML = `
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-3 text-gray-600">Memuat daftar kandidat...</p>
    </div>
  `;

  db.collection("candidates")
    .orderBy("position")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        candidateList.innerHTML = `
          <div class="text-center py-8">
            <p class="text-gray-500">Belum ada kandidat yang terdaftar</p>
          </div>
        `;
        return;
      }

      candidateList.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          ${snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
                  <div class="relative pb-48">
                    <img
                      src="${data.photoUrl}"
                      alt="${data.name}"
                      class="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div class="p-4">
                    <div class="uppercase tracking-wide text-sm text-blue-500 font-semibold">
                      ${data.position}
                    </div>
                    <h3 class="mt-2 text-xl font-semibold text-gray-800">
                      ${data.name}
                    </h3>
                    <div class="mt-4">
                      <button
                        onclick="vote('${doc.id}')"
                        data-candidate-id="${doc.id}"
                        class="vote-btn w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1"
                      >
                        Pilih Kandidat
                      </button>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      // Disable vote buttons if user has voted
      checkIfUserHasVoted();
    })
    .catch((error) => {
      console.error("Error loading candidates:", error);
      candidateList.innerHTML = `
        <div class="text-center py-8">
          <p class="text-red-500">Gagal memuat daftar kandidat. Silakan coba lagi.</p>
        </div>
      `;
    });
}

function checkIfUserHasVoted() {
  if (!auth.currentUser) return;

  db.collection("votes")
    .where("userId", "==", auth.currentUser.uid)
    .get()
    .then((snapshot) => {
      const hasVoted = !snapshot.empty;
      const buttons = document.querySelectorAll(".vote-btn");

      buttons.forEach((btn) => {
        btn.disabled = hasVoted;
        if (hasVoted) {
          const votedId = snapshot.docs[0].data().candidateId;
          if (btn.getAttribute("data-candidate-id") === votedId) {
            btn.className =
              "vote-btn w-full bg-green-500 text-white py-2 px-4 rounded-md cursor-not-allowed";
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Dipilih';
          } else {
            btn.className =
              "vote-btn w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-md cursor-not-allowed";
            btn.textContent = "Tidak Dapat Memilih";
          }
        }
      });

      // Tampilkan pesan jika sudah memilih
      if (hasVoted) {
        showMessage(
          "Anda sudah memberikan suara. Hubungi admin jika ada masalah.",
          "info"
        );
      }
    });
}

function vote(candidateId) {
  if (!auth.currentUser) {
    showMessage("Anda harus login terlebih dahulu!", "error");
    return;
  }

  // Cek apakah sudah memilih
  db.collection("votes")
    .where("userId", "==", auth.currentUser.uid)
    .get()
    .then((snapshot) => {
      if (!snapshot.empty) {
        showMessage("Anda sudah memberikan suara!", "error");
        return Promise.reject("Already voted");
      }

      // Konfirmasi pemilihan
      if (
        !confirm(
          "Apakah Anda yakin dengan pilihan Anda? Pilihan tidak dapat diubah."
        )
      ) {
        return Promise.reject("Cancelled");
      }

      // Simpan vote
      return db.collection("votes").add({
        candidateId: candidateId,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      showMessage("Terima kasih atas partisipasi Anda!", "success");
      checkIfUserHasVoted();
    })
    .catch((error) => {
      if (error === "Already voted" || error === "Cancelled") return;
      console.error("Error voting:", error);
      showMessage("Gagal melakukan voting. Silakan coba lagi.", "error");
    });
}

function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-500"
      : "bg-blue-500"
  } text-white transform transition-all duration-300 ease-in-out`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);

  // Animate in
  setTimeout(() => messageDiv.classList.add("translate-y-4"), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    messageDiv.classList.remove("translate-y-4");
    messageDiv.classList.add("-translate-y-full");
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadCandidates();
  auth.onAuthStateChanged((user) => {
    if (user) {
      checkIfUserHasVoted();
    }
  });
});
