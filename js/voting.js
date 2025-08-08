// Fungsi-fungsi untuk pemilih (tampil kandidat, voting, cek sudah voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadCandidates() {
  const candidateList = document.getElementById("candidate-list");
  if (!candidateList) return;
  candidateList.innerHTML =
    '<div class="col-span-2 text-center text-gray-400">Memuat kandidat...</div>';
  db.collection("candidates")
    .orderBy("number")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        candidateList.innerHTML =
          '<div class="col-span-2 text-center text-gray-400">Belum ada kandidat.</div>';
        return;
      }
      candidateList.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement("div");
        card.className =
          "bg-gray-50 rounded-lg p-6 flex flex-col items-center shadow";
        card.innerHTML = `
        <img src="${
          data.photoUrl || "https://via.placeholder.com/100"
        }" alt="Foto" class="w-24 h-24 rounded-full mb-4 object-cover border-2 border-blue-200">
        <div class="text-lg font-bold mb-1">${data.name}</div>
        <div class="text-gray-500 mb-4">No. Urut: ${data.number}</div>
        <button class="vote-btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" data-id="${
          doc.id
        }">Pilih</button>
      `;
        candidateList.appendChild(card);
      });

      // Cek apakah sudah voting
      db.collection("votes")
        .doc(auth.currentUser.uid)
        .get()
        .then((voteDoc) => {
          if (voteDoc.exists) {
            document
              .querySelectorAll(".vote-btn")
              .forEach((btn) => (btn.disabled = true));
            showMessage("Anda sudah memberikan suara.", "text-green-600");
          } else {
            document.querySelectorAll(".vote-btn").forEach((btn) => {
              btn.disabled = false;
              btn.addEventListener("click", function () {
                voteCandidate(this.getAttribute("data-id"));
              });
            });
            showMessage("", "");
          }
        });
    });
}

function voteCandidate(candidateId) {
  db.collection("votes")
    .doc(auth.currentUser.uid)
    .set({
      candidateId: candidateId,
      email: auth.currentUser.email,
      votedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      loadCandidates();
    });
}
