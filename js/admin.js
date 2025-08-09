// Fungsi-fungsi admin (tambah/hapus kandidat, tampil kandidat admin, chart hasil voting)
// Pastikan sudah load firebase-config.js sebelum file ini

function loadAdminDashboard() {
  loadVoteChart();
  loadAdminCandidates();
}

function loadVoteChart() {
  db.collection("candidates")
    .orderBy("number")
    .get()
    .then((snapshot) => {
      const labels = [];
      const data = [];
      const colors = [];
      const candidateIds = [];
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
          voteSnap.forEach((voteDoc) => {
            const cid = voteDoc.data().candidateId;
            if (count[cid] !== undefined) count[cid]++;
          });
          candidateIds.forEach((id, i) => (data[i] = count[id]));

          const ctx = document.getElementById("voteChart").getContext("2d");
          if (window.voteChart) window.voteChart.destroy();
          window.voteChart = new Chart(ctx, {
            type: "bar",
            data: {
              labels: labels,
              datasets: [
                {
                  label: "Jumlah Suara",
                  data: data,
                  backgroundColor: colors,
                },
              ],
            },
            options: {
              responsive: true,
              scales: {
                y: { beginAtZero: true, precision: 0 },
              },
            },
          });
        });
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
  const response = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });
  return response.json();
}

if (document.getElementById("add-candidate-form")) {
  document
    .getElementById("add-candidate-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const addCandidateError = document.getElementById("add-candidate-error");
      addCandidateError.textContent = "";
      const number = parseInt(
        document.getElementById("candidate-number").value
      );
      const name = document.getElementById("candidate-name").value.trim();
      const photoFile = document.getElementById("candidate-photo").files[0];
      if (!number || !name || !photoFile) {
        addCandidateError.textContent = "Semua field wajib diisi!";
        return;
      }
      try {
        // Upload ke Cloudinary
        const result = await uploadToCloudinary(photoFile);
        if (!result.secure_url) throw new Error("Upload gagal");
        const photoUrl = result.secure_url;
        // Simpan data kandidat ke Firestore
        await db.collection("candidates").add({
          number: number,
          name: name,
          photoUrl: photoUrl,
        });
        document.getElementById("add-candidate-form").reset();
        loadAdminCandidates();
      } catch (err) {
        addCandidateError.textContent = "Gagal menambah kandidat.";
      }
    });
}
