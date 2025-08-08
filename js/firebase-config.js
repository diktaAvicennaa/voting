// Konfigurasi dan inisialisasi Firebase
// GANTI DENGAN KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyAjSu9b46JKp1xVRaRIyHhVsqVyYtT7cPA",
  authDomain: "voting-c14a8.firebaseapp.com",
  projectId: "voting-c14a8",
  storageBucket: "voting-c14a8.appspot.com",
  messagingSenderId: "517448112515",
  appId: "1:517448112515:web:3e158e0e8e863ed240feb6",
  measurementId: "G-R860NTR3XN",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
