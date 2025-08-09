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
    .get()
    .then((snapshot) => {
      const labels = [];
      const data = [];
      const colors = [];
      const candidateIds = [];

      console.log("Got candidates:", snapshot.size);

      snapshot.forEach((doc) => {
        const d = doc.data();
        labels.push(d.name);
        colors.push("#60a5fa");
        candidateIds.push(doc.id);
      });

      db.collection("votes")
        .get()
        .then((voteSnap) => {
          const count = {};
          candidateIds.forEach((id) => (count[id] = 0));

          console.log("Got votes:", voteSnap.size);

          voteSnap.forEach((voteDoc) => {
            const cid = voteDoc.data().candidateId;
            if (count[cid] !== undefined) count[cid]++;
          });

          candidateIds.forEach((id, i) => (data[i] = count[id]));

          const canvas = document.getElementById("voteChart");
          if (!canvas) {
            console.error("Canvas element not found!");
            return;
          }

          const ctx = canvas.getContext("2d");
          if (window.voteChart) {
            console.log("Destroying old chart");
            window.voteChart.destroy();
          }

          console.log("Creating chart with data:", { labels, data });

          window.voteChart = new Chart(ctx, {
            type: "bar",
            data: {
              labels: labels,
              datasets: [
                {
                  label: "Jumlah Suara",
                  data: data,
                  backgroundColor: colors,
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
                  precision: 0,
                  title: {
                    display: true,
                    text: "Jumlah Suara",
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
        })
        .catch((error) => {
          console.error("Error getting votes:", error);
        });
    })
    .catch((error) => {
      console.error("Error getting candidates:", error);
    });
}

function loadAdminCandidates() {
  console.log("Loading admin candidates...");
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
    .get()
    .then((snapshot) => {
      console.log("Got candidates:", snapshot.size);

      if (snapshot.empty) {
        adminCandidateList.innerHTML =
          '<div class="text-gray-400">Belum ada kandidat.</div>';
        return;
      }

      adminCandidateList.innerHTML = "";
      snapshot.forEach((doc) => {
        console.log("Processing candidate:", doc.id);
        const data = doc.data();
        const div = document.createElement("div");
        div.className =
          "flex items-center justify-between bg-white p-3 rounded shadow";
        div.innerHTML = `
          <div class="flex items-center space-x-3">
            <img src="${data.photoUrl || "https://via.placeholder.com/50"}" 
                 class="w-12 h-12 rounded-full object-cover border border-blue-200"
                 alt="${data.name}">
            <div>
              <div class="font-bold">${data.name}</div>
              <div class="text-xs text-gray-500">Jabatan: ${data.position}</div>
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
              .then(() => {
                loadAdminCandidates();
                loadVoteChart();
              })
              .catch((error) => {
                console.error("Error deleting:", error);
                alert("Gagal menghapus kandidat: " + error.message);
              });
          }
        });
      });
    })
    .catch((error) => {
      console.error("Error loading candidates:", error);
      adminCandidateList.innerHTML =
        '<div class="text-red-500">Error: Gagal memuat kandidat!</div>';
    });
}

// Konfigurasi Cloudinary
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dq5znin5d/upload";
const CLOUDINARY_UPLOAD_PRESET = "upload";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "voting"); // Save to specific folder
  formData.append("resource_type", "auto"); // Auto-detect file type

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary Error:", errorData);
      throw new Error(errorData.error?.message || "Upload failed");
    }

    return response.json();
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
}

// Form submission handler
if (document.getElementById("add-candidate-form")) {
  document
    .getElementById("add-candidate-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const addCandidateError = document.getElementById("add-candidate-error");
      addCandidateError.textContent = "";

      try {
        // Check auth status
        if (!auth.currentUser) {
          throw new Error("Anda harus login sebagai admin!");
        }

        // Validate inputs
        const photoFile = document.getElementById("candidate-photo").files[0];
        if (photoFile && !photoFile.type.startsWith("image/")) {
          throw new Error("Pilih file gambar (JPG, PNG)");
        }

        const position = document
          .getElementById("candidate-position")
          .value.trim();
        const name = document.getElementById("candidate-name").value.trim();

        if (!position || !name || !photoFile) {
          throw new Error("Semua field wajib diisi!");
        }

        // Show loading state
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Mengunggah...";
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(photoFile);
        console.log("Upload result:", result);

        if (!result.secure_url) {
          throw new Error("Upload gagal: URL tidak ditemukan");
        }

        // Save to Firestore
        const docRef = await db.collection("candidates").add({
          position: position,
          name: name,
          photoUrl: result.secure_url,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Candidate added with ID:", docRef.id);

        // Reset form and show success
        this.reset();
        addCandidateError.textContent = "Kandidat berhasil ditambahkan!";
        addCandidateError.className = "text-green-500 text-sm mt-2";

        // Refresh candidate list
        loadAdminCandidates();
      } catch (err) {
        console.error("Error:", err);
        addCandidateError.textContent =
          err.message || "Gagal menambah kandidat.";
        addCandidateError.className = "text-red-500 text-sm mt-2";
      } finally {
        // Reset button state
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Tambah";
        }
      }
    });
}

// Tambahkan tombol Reset Votes di bagian admin
function addResetVotesButton() {
  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls) return;

  const resetButton = document.createElement("button");
  resetButton.className =
    "mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 text-sm";
  resetButton.innerHTML =
    '<i class="fas fa-trash-alt mr-2"></i>Reset Semua Suara';

  resetButton.addEventListener("click", resetAllVotes);
  adminControls.appendChild(resetButton);
}

async function resetAllVotes() {
  if (!auth.currentUser?.email?.includes("admin")) {
    showMessage("Hanya admin yang dapat mereset suara!", "error");
    return;
  }

  if (
    !confirm(
      "PERHATIAN: Ini akan menghapus SEMUA suara yang sudah masuk. Lanjutkan?"
    )
  ) {
    return;
  }

  try {
    // Get all votes
    const votesSnapshot = await db.collection("votes").get();

    // Delete each vote
    const batch = db.batch();
    votesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    showMessage("Semua suara berhasil direset!", "success");
    loadVoteChart(); // Refresh chart
  } catch (error) {
    console.error("Error resetting votes:", error);
    showMessage("Gagal mereset suara: " + error.message, "error");
  }
}

// Tambahkan fungsi untuk melihat detail voting
function addVotingDetails() {
  const adminControls = document.querySelector("#admin-container .mb-10");
  if (!adminControls) return;

  const detailsButton = document.createElement("button");
  detailsButton.className =
    "ml-4 mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm";
  detailsButton.innerHTML = '<i class="fas fa-list mr-2"></i>Detail Pemilih';

  detailsButton.addEventListener("click", showVotingDetails);
  adminControls.appendChild(detailsButton);
}

async function showVotingDetails() {
  try {
    const votesSnapshot = await db
      .collection("votes")
      .orderBy("timestamp", "desc")
      .get();

    let details = votesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return `
        <tr>
          <td class="px-4 py-2">${data.userEmail}</td>
          <td class="px-4 py-2">${
            data.timestamp?.toDate().toLocaleString() || "N/A"
          }</td>
        </tr>
      `;
    });

    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <h3 class="text-xl font-bold mb-4">Detail Pemilih</h3>
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left">Email Pemilih</th>
              <th class="px-4 py-2 text-left">Waktu Memilih</th>
            </tr>
          </thead>
          <tbody>
            ${details.join("")}
          </tbody>
        </table>
        <button class="mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600">
          Tutup
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("button").onclick = () => modal.remove();
  } catch (error) {
    console.error("Error showing voting details:", error);
    showMessage("Gagal memuat detail pemilih", "error");
  }
}
