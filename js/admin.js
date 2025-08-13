// Fungsi-fungsi admin (tambah/hapus kandidat, tampil kandidat admin, chart hasil voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadAdminDashboard() {
  console.log("Loading admin dashboard...");
  loadVoteChart();
  loadAdminCandidates();
  addResetVotesButton();
  addVotingDetails();
}

// FUNGSI GRAFIK YANG SUDAH DIPERBARUI
function loadVoteChart() {
  console.log("Loading vote chart...");

  if (!auth.currentUser) {
    console.error("User not authenticated");
    return;
  }

  // Daftarkan plugin datalabels secara global
  Chart.register(ChartDataLabels);

  db.collection("candidates")
    .orderBy("number")
    .onSnapshot(
      (snapshot) => {
        const labels = [];
        const data = [];
        const candidateIds = [];

        // Palet warna yang lebih menarik
        const colors = [
          "#3B82F6",
          "#10B981",
          "#EF4444",
          "#F59E0B",
          "#8B5CF6",
          "#EC4899",
          "#6366F1",
          "#14B8A6",
        ];
        const backgroundColors = [];

        snapshot.forEach((doc, index) => {
          const d = doc.data();
          labels.push(d.name);
          candidateIds.push(doc.id);
          // Pilih warna secara berurutan, ulangi jika kandidat lebih banyak dari warna
          backgroundColors.push(colors[index % colors.length]);
        });

        db.collection("votes").onSnapshot(
          (voteSnap) => {
            const count = {};
            candidateIds.forEach((id) => (count[id] = 0));
            voteSnap.forEach((voteDoc) => {
              const cid = voteDoc.data().candidateId;
              if (count[cid] !== undefined) count[cid]++;
            });
            // Hapus data lama sebelum diisi ulang
            data.length = 0;
            candidateIds.forEach((id) => data.push(count[id]));

            const canvas = document.getElementById("voteChart");
            if (!canvas) return;
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
                    backgroundColor: backgroundColors, // Gunakan warna-warni
                    borderColor: backgroundColors.map((color) =>
                      color.replace(")", ", 0.5)").replace("rgb", "rgba")
                    ), // Border transparan
                    borderWidth: 1,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false, // Sembunyikan legenda karena warna sudah jelas
                  },
                  title: {
                    display: true,
                    text: "Hasil Perolehan Suara Real-Time",
                    font: { size: 18, weight: "bold" },
                    padding: { top: 10, bottom: 20 },
                  },
                  // Konfigurasi untuk menampilkan angka di atas bar
                  datalabels: {
                    anchor: "end",
                    align: "top",
                    font: {
                      weight: "bold",
                    },
                    color: "#4B5563", // Warna teks abu-abu
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                  },
                  x: {
                    grid: { display: false }, // Hilangkan grid vertikal
                  },
                },
              },
            });
          },
          (error) => console.error("Error listening to votes:", error)
        );
      },
      (error) => console.error("Error listening to candidates:", error)
    );
}

function loadAdminCandidates() {
  // ... Tidak ada perubahan di sini ...
  // (Pastikan kode Anda untuk fungsi ini sudah menggunakan onSnapshot)
}

// FUNGSI TOMBOL YANG SUDAH DIPERBARUI
function addResetVotesButton() {
  // Cek apakah tombol sudah ada untuk mencegah duplikat
  if (document.getElementById("reset-votes-btn")) return;

  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls) return;

  const resetButton = document.createElement("button");
  resetButton.id = "reset-votes-btn"; // Tambahkan ID
  resetButton.className =
    "bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 text-sm";
  resetButton.innerHTML =
    '<i class="fas fa-trash-alt mr-2"></i>Reset Semua Suara';

  resetButton.addEventListener("click", resetAllVotes);
  adminControls.appendChild(resetButton);
}

function addVotingDetails() {
  // Cek apakah tombol sudah ada untuk mencegah duplikat
  if (document.getElementById("detail-pemilih-btn")) return;

  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls) return;

  const detailsButton = document.createElement("button");
  detailsButton.id = "detail-pemilih-btn"; // Tambahkan ID
  detailsButton.className =
    "ml-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm";
  detailsButton.innerHTML = '<i class="fas fa-list mr-2"></i>Detail Pemilih';

  detailsButton.addEventListener("click", showVotingDetails);
  adminControls.appendChild(detailsButton);
}

// ... Sisanya (uploadToCloudinary, form submit, resetAllVotes, showVotingDetails) tidak ada perubahan ...
