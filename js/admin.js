// Fungsi-fungsi admin (tambah/hapus kandidat, tampil kandidat admin, chart hasil voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadAdminDashboard() {
  console.log("Loading admin dashboard...");
  loadVoteChart();
  loadAdminCandidates();
  addResetVotesButton();
  addVotingDetails();
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

            data.length = 0; // Hapus data lama
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
                    backgroundColor: "#60a5fa", // Kembali ke satu warna
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
  // ... Kode fungsi ini tidak perlu diubah dari versi terakhir ...
}

function addResetVotesButton() {
  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls) return;

  // Cek sederhana agar tidak duplikat jika loadAdminDashboard terpanggil lagi
  if (adminControls.querySelector("#reset-votes-btn")) return;

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
  if (!adminControls) return;

  // Cek sederhana agar tidak duplikat
  if (adminControls.querySelector("#detail-pemilih-btn")) return;

  const detailsButton = document.createElement("button");
  detailsButton.id = "detail-pemilih-btn";
  detailsButton.className =
    "ml-4 mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm";
  detailsButton.innerHTML = '<i class="fas fa-list mr-2"></i>Detail Pemilih';

  detailsButton.addEventListener("click", showVotingDetails);
  adminControls.appendChild(detailsButton);
}

// ... Sisanya (uploadToCloudinary, form submit, resetAllVotes, showVotingDetails) tidak ada perubahan ...
