// Fungsi-fungsi admin (tambah/hapus kandidat, tampil kandidat admin, chart hasil voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadAdminDashboard() {
  console.log("Loading admin dashboard...");
  loadVoteChart();
  loadAdminCandidates();
  addResetVotesButton();
  addVotingDetails();
  setupAddCandidateForm(); // Panggil fungsi untuk form di sini
}

function setupAddCandidateForm() {
  const addCandidateForm = document.getElementById("add-candidate-form");
  if (addCandidateForm) {
    addCandidateForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const number = document.getElementById("candidate-number").value;
      const name = document.getElementById("candidate-name").value;
      const position = document.getElementById("candidate-position").value;
      const photo = document.getElementById("candidate-photo").files[0];
      const addButton = document.getElementById("add-candidate-button");
      const errorMessage = document.getElementById("add-candidate-error");

      if (!photo) {
        errorMessage.textContent = "Foto kandidat harus diisi.";
        return;
      }

      addButton.disabled = true;
      addButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Menambahkan...';
      errorMessage.textContent = "";

      const storageRef = storage.ref(
        `candidate-photos/${Date.now()}_${photo.name}`
      );
      const uploadTask = storageRef.put(photo);

      uploadTask.on(
        "state_changed",
        null, // No need for progress tracking in this case
        (error) => {
          console.error("Upload failed:", error);
          errorMessage.textContent = "Gagal mengunggah foto: " + error.message;
          addButton.disabled = false;
          addButton.innerHTML =
            '<i class="fas fa-plus mr-2"></i><span>Tambah</span>';
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            db.collection("candidates")
              .add({
                number: parseInt(number, 10),
                name: name,
                position: position,
                photoUrl: downloadURL,
              })
              .then(() => {
                addCandidateForm.reset();
                addButton.disabled = false;
                addButton.innerHTML =
                  '<i class="fas fa-plus mr-2"></i><span>Tambah</span>';
                // Kandidat akan otomatis muncul karena onSnapshot
              })
              .catch((error) => {
                console.error("Error adding candidate:", error);
                errorMessage.textContent =
                  "Gagal menambahkan kandidat: " + error.message;
                addButton.disabled = false;
                addButton.innerHTML =
                  '<i class="fas fa-plus mr-2"></i><span>Tambah</span>';
              });
          });
        }
      );
    });
  }
}

function loadVoteChart() {
  console.log("Loading vote chart...");

  if (!auth.currentUser) {
    console.error("User not authenticated");
    return;
  }

  db.collection("candidates")
    .orderBy("number")
    .onSnapshot(
      (snapshot) => {
        const labels = [];
        const data = [];
        const candidateIds = [];

        snapshot.forEach((doc) => {
          const d = doc.data();
          labels.push(d.name);
          candidateIds.push(doc.id);
        });

        db.collection("votes").onSnapshot(
          (voteSnap) => {
            const count = {};
            candidateIds.forEach((id) => (count[id] = 0));

            voteSnap.forEach((voteDoc) => {
              const cid = voteDoc.data().candidateId;
              if (count[cid] !== undefined) count[cid]++;
            });

            data.length = 0; // Hapus data lama sebelum diisi ulang
            candidateIds.forEach((id) => data.push(count[id]));

            const canvas = document.getElementById("voteChart");
            if (!canvas) {
              console.error("Canvas element not found!");
              return;
            }

            const ctx = canvas.getContext("2d");

            if (
              window.voteChart &&
              typeof window.voteChart.destroy === "function"
            ) {
              window.voteChart.destroy();
            }

            window.voteChart = new Chart(ctx, {
              type: "bar",
              data: {
                labels: labels,
                datasets: [
                  {
                    label: "Jumlah Suara",
                    data: data,
                    backgroundColor: "#60a5fa", // Warna biru standar
                    borderWidth: 1,
                    borderColor: "#2563eb",
                  },
                ],
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Hasil Perolehan Suara",
                    font: {
                      size: 16,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: "Nama Kandidat",
                    },
                  },
                },
              },
            });
          },
          (error) => {
            console.error("Error listening to votes for chart:", error);
          }
        );
      },
      (error) => {
        console.error("Error listening to candidates for chart:", error);
      }
    );
}

function loadAdminCandidates() {
  const adminCandidateList = document.getElementById("admin-candidate-list");
  if (!adminCandidateList) {
    console.error("Admin candidate list element not found");
    return;
  }

  adminCandidateList.innerHTML =
    '<div class="text-gray-400">Memuat kandidat...</div>';

  if (!auth.currentUser) {
    adminCandidateList.innerHTML =
      '<div class="text-red-500">Error: Anda harus login sebagai admin!</div>';
    return;
  }

  db.collection("candidates")
    .orderBy("number")
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          adminCandidateList.innerHTML =
            '<div class="text-gray-400">Belum ada kandidat.</div>';
          return;
        }

        adminCandidateList.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          const div = document.createElement("div");
          div.className =
            "flex items-center justify-between bg-white p-3 rounded shadow";
          div.innerHTML = `
            <div class="flex items-center space-x-3">
              <img src="${
                data.photoUrl || "https://via.placeholder.com/50"
              }" class="w-12 h-12 rounded-full object-cover border border-blue-200" alt="${
            data.name
          }">
              <div>
                <div class="font-bold">${data.name}</div>
                <div class="text-xs text-gray-500">Jabatan: ${
                  data.position
                }</div>
              </div>
            </div>
            <button class="delete-candidate-btn text-red-500 hover:text-red-700" data-id="${
              doc.id
            }">
              <i class="fas fa-trash"></i>
            </button>
          `;
          adminCandidateList.appendChild(div);
        });

        document.querySelectorAll(".delete-candidate-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            if (confirm("Yakin hapus kandidat ini?")) {
              db.collection("candidates")
                .doc(id)
                .delete()
                .catch((error) => {
                  console.error("Error deleting:", error);
                  alert("Gagal menghapus kandidat: " + error.message);
                });
            }
          });
        });
      },
      (error) => {
        console.error("Error listening to candidates:", error);
        adminCandidateList.innerHTML =
          '<div class="text-red-500">Error: Gagal memuat kandidat!</div>';
      }
    );
}

function addResetVotesButton() {
  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls || document.getElementById("reset-votes-btn")) return;

  const resetButton = document.createElement("button");
  resetButton.id = "reset-votes-btn";
  resetButton.className =
    "mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 text-sm";
  resetButton.innerHTML =
    '<i class="fas fa-trash-alt mr-2"></i>Reset Semua Suara';
  resetButton.addEventListener("click", resetAllVotes);
  adminControls.appendChild(resetButton);
}

function addVotingDetails() {
  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls || document.getElementById("detail-pemilih-btn")) return;

  const detailsButton = document.createElement("button");
  detailsButton.id = "detail-pemilih-btn";
  detailsButton.className =
    "ml-4 mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm";
  detailsButton.innerHTML = '<i class="fas fa-list mr-2"></i>Detail Pemilih';
  detailsButton.addEventListener("click", showVotingDetails);
  adminControls.appendChild(detailsButton);
}
// ... (fungsi-fungsi lainnya tidak perlu diubah)
