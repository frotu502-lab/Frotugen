const firebaseConfig = {
  apiKey: "AIzaSyBgsHE8i4LcOXM_x4UCxkDX0fTzwjpnBmI",
  authDomain: "frotu-8093e.firebaseapp.com",
  projectId: "frotu-8093e",
  storageBucket: "frotu-8093e.firebasestorage.app",
  messagingSenderId: "371185042697",
  appId: "1:371185042697:web:c339645a3c648d6d6d7fd8",
  measurementId: "G-W8ZYKENSPH"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.settings({
  experimentalAutoDetectLongPolling: true,
  merge: true
});
