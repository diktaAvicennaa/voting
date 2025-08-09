// Fungsi-fungsi admin (tambah/hapus kandidat, tampil kandidat admin, chart hasil voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadAdminDashboard() {
  console.log("Loading admin dashboard...");
  loadVoteChart();
  loadAdminCandidates();
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
              <div class="text-xs text-gray-500">No. Urut: ${data.number}</div>
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

        const number = parseInt(
          document.getElementById("candidate-number").value
        );
        const name = document.getElementById("candidate-name").value.trim();

        if (!number || !name || !photoFile) {
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
          number: number,
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
