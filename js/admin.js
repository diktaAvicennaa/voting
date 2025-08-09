// Fungsi-fungsi admin (tambah/hapus kandidat, tampil kandidat admin, chart hasil voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadAdminDashboard() {
  loadVoteChart();
  loadAdminCandidates();
}

function loadVoteChart() {
  console.log("Loading vote chart..."); // Debug log

  db.collection("candidates")
    .orderBy("number")
    .get()
    .then((snapshot) => {
      const labels = [];
      const data = [];
      const colors = [];
      const candidateIds = [];

      console.log("Got candidates:", snapshot.size); // Debug log

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

          console.log("Got votes:", voteSnap.size); // Debug log

          voteSnap.forEach((voteDoc) => {
            const cid = voteDoc.data().candidateId;
            if (count[cid] !== undefined) count[cid]++;
          });

          candidateIds.forEach((id, i) => (data[i] = count[id]));

          const canvas = document.getElementById("voteChart");
          if (!canvas) {
            console.error("Canvas element not found!"); // Debug error
            return;
          }

          const ctx = canvas.getContext("2d");
          if (window.voteChart) {
            console.log("Destroying old chart"); // Debug log
            window.voteChart.destroy();
          }

          console.log("Creating new chart with data:", { labels, data }); // Debug log

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
          console.error("Error getting votes:", error); // Debug error
        });
    })
    .catch((error) => {
      console.error("Error getting candidates:", error); // Debug error
    });
}

function loadAdminCandidates() {
  const adminCandidateList = document.getElementById("admin-candidate-list");
  if (!adminCandidateList) return;
  adminCandidateList.innerHTML =
    '<div class="text-gray-400">Memuat kandidat...</div>';
  db.collection("candidates")
    .orderBy("number")
    .get()
    .then((snapshot) => {
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
            }" class="w-12 h-12 rounded-full object-cover border border-blue-200">
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
              });
          }
        });
      });
    });
}

// Konfigurasi Cloudinary
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dq5znin5d/upload";
const CLOUDINARY_UPLOAD_PRESET = "upload";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  // Add these additional parameters
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

// Update the form submission handler
if (document.getElementById("add-candidate-form")) {
  document
    .getElementById("add-candidate-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const addCandidateError = document.getElementById("add-candidate-error");
      addCandidateError.textContent = "";

      try {
        // Validate file type
        const photoFile = document.getElementById("candidate-photo").files[0];
        if (photoFile && !photoFile.type.startsWith("image/")) {
          throw new Error("Please select an image file (JPG, PNG)");
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
          submitButton.textContent = "Uploading...";
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(photoFile);
        console.log("Upload result:", result);

        if (!result.secure_url) {
          throw new Error("Upload gagal: URL tidak ditemukan");
        }

        // Save to Firestore
        await db.collection("candidates").add({
          number: number,
          name: name,
          photoUrl: result.secure_url,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Reset form
        this.reset();
        loadAdminCandidates();
      } catch (err) {
        console.error("Error:", err);
        addCandidateError.textContent =
          err.message || "Gagal menambah kandidat.";
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
