// js/admin.js

// --- KONFIGURASI CLOUDINARY ANDA ---
// Pastikan Cloud Name dan Upload Preset Anda sudah benar.
const CLOUDINARY_CLOUD_NAME = "dq5znin5d"; // Cloud Name Anda
const CLOUDINARY_UPLOAD_PRESET = "upload"; // Upload Preset Anda

// --- PERBAIKAN: URL INI TELAH DIGANTI KE FORMAT YANG BENAR ---
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// -----------------------------------------------------------

function loadAdminDashboard() {
  console.log("Loading admin dashboard...");
  loadVoteChart();
  loadAdminCandidates();
  addResetVotesButton();
  addVotingDetails();
  setupAddCandidateForm();
}

function setupAddCandidateForm() {
  const addCandidateForm = document.getElementById("add-candidate-form");
  if (!addCandidateForm) return;

  addCandidateForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const number = document.getElementById("candidate-number").value;
    const name = document.getElementById("candidate-name").value;
    const position = document.getElementById("candidate-position").value;
    const photoFile = document.getElementById("candidate-photo").files[0];
    const addButton = document.getElementById("add-candidate-button");
    const errorMessage = document.getElementById("add-candidate-error");

    if (!photoFile) {
      errorMessage.textContent = "Foto kandidat harus diisi.";
      return;
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      errorMessage.textContent =
        "Konfigurasi Cloudinary belum diisi di js/admin.js";
      return;
    }

    addButton.disabled = true;
    addButton.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Mengunggah foto...';
    errorMessage.textContent = "";

    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gagal unggah ke Cloudinary: ${errorData.error.message}`
        );
      }

      const data = await response.json();
      const photoUrl = data.secure_url;

      addButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan data...';

      await db.collection("candidates").add({
        number: parseInt(number, 10),
        name: name,
        position: position,
        photoUrl: photoUrl,
      });

      addCandidateForm.reset();
    } catch (error) {
      console.error("Proses tambah kandidat gagal:", error);
      errorMessage.textContent = "Gagal menambahkan kandidat. " + error.message;
    } finally {
      addButton.disabled = false;
      addButton.innerHTML =
        '<i class="fas fa-plus mr-2"></i><span>Tambah</span>';
    }
  });
}

function loadVoteChart() {
  if (!auth.currentUser) return;

  db.collection("candidates")
    .orderBy("number")
    .onSnapshot(
      (snapshot) => {
        const labels = snapshot.docs.map((doc) => doc.data().name);
        const candidateIds = snapshot.docs.map((doc) => doc.id);

        db.collection("votes").onSnapshot(
          (voteSnap) => {
            const voteCounts = new Map(candidateIds.map((id) => [id, 0]));
            voteSnap.forEach((voteDoc) => {
              const cid = voteDoc.data().candidateId;
              if (voteCounts.has(cid)) {
                voteCounts.set(cid, voteCounts.get(cid) + 1);
              }
            });

            const data = candidateIds.map((id) => voteCounts.get(id));
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
                    backgroundColor: "#60a5fa",
                    borderColor: "#2563eb",
                    borderWidth: 1,
                  },
                ],
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: {
                    display: true,
                    text: "Hasil Perolehan Suara",
                    font: { size: 16 },
                  },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  x: { title: { display: true, text: "Nama Kandidat" } },
                },
              },
            });
          },
          (error) => console.error("Error listening to votes for chart:", error)
        );
      },
      (error) =>
        console.error("Error listening to candidates for chart:", error)
    );
}

function loadAdminCandidates() {
  const adminCandidateList = document.getElementById("admin-candidate-list");
  if (!adminCandidateList) return;

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
            }" class="w-12 h-12 rounded-full object-cover border" alt="${
            data.name
          }">
            <div>
              <div class="font-bold">${data.name}</div>
              <div class="text-xs text-gray-500">Jabatan: ${data.position}</div>
            </div>
          </div>
          <button class="delete-candidate-btn text-red-500 hover:text-red-700" data-id="${
            doc.id
          }">
            <i class="fas fa-trash"></i>
          </button>`;
          adminCandidateList.appendChild(div);
        });

        document.querySelectorAll(".delete-candidate-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            if (confirm("Yakin hapus kandidat ini?")) {
              db.collection("candidates")
                .doc(id)
                .delete()
                .catch((error) =>
                  alert("Gagal menghapus kandidat: " + error.message)
                );
            }
          });
        });
      },
      (error) => {
        adminCandidateList.innerHTML =
          '<div class="text-red-500">Error: Gagal memuat kandidat!</div>';
      }
    );
}

async function resetAllVotes() {
  if (
    !confirm(
      "APAKAH ANDA YAKIN? Tindakan ini akan menghapus SEMUA data suara secara permanen."
    )
  )
    return;
  const votesCollection = db.collection("votes");
  try {
    const snapshot = await votesCollection.get();
    if (snapshot.empty) {
      alert("Tidak ada data suara untuk dihapus.");
      return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    alert("Berhasil! Semua data suara telah direset.");
  } catch (error) {
    alert("Gagal mereset suara. Lihat console untuk detail.");
    console.error("Error resetting votes:", error);
  }
}

async function showVotingDetails() {
  const detailsContainer = document.createElement("div");
  detailsContainer.className =
    "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50";
  detailsContainer.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[80vh] flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Detail Pemilih</h2>
        <button id="close-details" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
      </div>
      <div id="voter-list-content" class="overflow-y-auto">
        <p>Memuat data...</p>
      </div>
    </div>`;
  document.body.appendChild(detailsContainer);

  const close = () => detailsContainer.remove();
  detailsContainer
    .querySelector("#close-details")
    .addEventListener("click", close);
  detailsContainer.addEventListener("click", (e) => {
    if (e.target === detailsContainer) close();
  });

  try {
    const [votesSnapshot, candidatesSnapshot] = await Promise.all([
      db.collection("votes").orderBy("timestamp", "desc").get(),
      db.collection("candidates").get(),
    ]);
    const candidatesMap = new Map(
      candidatesSnapshot.docs.map((doc) => [doc.id, doc.data().name])
    );
    const listContent = detailsContainer.querySelector("#voter-list-content");

    if (votesSnapshot.empty) {
      listContent.innerHTML = "<p>Belum ada yang memberikan suara.</p>";
      return;
    }
    listContent.innerHTML = `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr>
            <th class="border-b-2 p-2 bg-gray-100">Email Pemilih</th>
            <th class="border-b-2 p-2 bg-gray-100">Memilih Kandidat</th>
            <th class="border-b-2 p-2 bg-gray-100">Waktu</th>
          </tr>
        </thead>
        <tbody>
          ${votesSnapshot.docs
            .map((doc) => {
              const vote = doc.data();
              return `
              <tr>
                <td class="border-b p-2">${vote.userEmail}</td>
                <td class="border-b p-2">${
                  candidatesMap.get(vote.candidateId) || "N/A"
                }</td>
                <td class="border-b p-2">${
                  vote.timestamp
                    ? vote.timestamp.toDate().toLocaleString("id-ID")
                    : "N/A"
                }</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  } catch (error) {
    console.error("Error fetching vote details:", error);
    detailsContainer.querySelector("#voter-list-content").innerHTML =
      "<p class='text-red-500'>Gagal memuat detail.</p>";
  }
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
