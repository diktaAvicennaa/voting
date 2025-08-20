// js/voting.js (SUDAH DIPERBAIKI)

function resetVotingUI() {
  console.log("Resetting voting UI to default state...");
  loadCandidates();
}

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
    .orderBy("number")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        candidateList.innerHTML = `<div class="text-center py-8"><p class="text-gray-500">Belum ada kandidat.</p></div>`;
        return;
      }

      candidateList.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          ${snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
                  <div class="relative pb-48">
                    <img src="${data.photoUrl}" alt="${data.name}" class="absolute inset-0 h-full w-full object-cover"/>
                  </div>
                  <div class="p-4">
                    <div class="uppercase tracking-wide text-sm text-blue-500 font-semibold">${data.position}</div>
                    <h3 class="mt-2 text-xl font-semibold text-gray-800">${data.name}</h3>
                    <div class="mt-4">
                      <button onclick="vote('${doc.id}')" data-candidate-id="${doc.id}" class="vote-btn w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                        Pilih Kandidat
                      </button>
                    </div>
                  </div>
                </div>`;
            })
            .join("")}
        </div>`;
      checkIfUserHasVoted();
    })
    .catch((error) => {
      console.error("Error loading candidates:", error);
      candidateList.innerHTML = `<div class="text-center py-8"><p class="text-red-500">Gagal memuat kandidat. Periksa Security Rules Anda.</p></div>`;
    });
}

function checkIfUserHasVoted() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;

  // Cek apakah dokumen vote untuk user ini ada
  db.collection("votes")
    .doc(userId)
    .get()
    .then((doc) => {
      const hasVoted = doc.exists;
      const buttons = document.querySelectorAll(".vote-btn");

      buttons.forEach((btn) => {
        btn.disabled = hasVoted;
        if (hasVoted) {
          const votedCandidateId = doc.data().candidateId;
          if (btn.getAttribute("data-candidate-id") === votedCandidateId) {
            btn.className =
              "vote-btn w-full bg-green-500 text-white py-2 px-4 rounded-md cursor-not-allowed";
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Pilihan Anda';
          } else {
            btn.className =
              "vote-btn w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-md cursor-not-allowed";
            btn.textContent = "Tidak Dapat Memilih";
          }
        }
      });

      if (hasVoted) {
        showMessage("Anda sudah memberikan suara. Terima kasih!", "info");
      }
    });
}

async function vote(candidateId) {
  if (!auth.currentUser) {
    showMessage("Anda harus login untuk memilih!", "error");
    return;
  }

  const userId = auth.currentUser.uid;
  const voteRef = db.collection("votes").doc(userId);

  try {
    const doc = await voteRef.get();
    if (doc.exists) {
      showMessage("Anda sudah pernah memberikan suara!", "error");
      return;
    }

    if (
      !confirm(
        "Apakah Anda yakin dengan pilihan ini? Pilihan tidak dapat diubah."
      )
    ) {
      return;
    }

    // --- PERBAIKAN LOGIKA: Menggunakan .set() dengan ID user ---
    await voteRef.set({
      candidateId: candidateId,
      userId: userId,
      userEmail: auth.currentUser.email,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage("Terima kasih! Suara Anda telah dicatat.", "success");
    checkIfUserHasVoted();
  } catch (error) {
    console.error("Error voting:", error);
    showMessage(
      "Gagal melakukan voting. Periksa Security Rules Anda.",
      "error"
    );
  }
}

function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div");
  messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white transform transition-all z-50 ${
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-500"
      : "bg-blue-500"
  }`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.classList.add("translate-y-4"), 100);
  setTimeout(() => {
    messageDiv.classList.remove("translate-y-4");
    messageDiv.classList.add("-translate-y-full");
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

