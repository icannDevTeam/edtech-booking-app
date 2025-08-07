// Firebase config (reuse from main app)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:    "AIzaSyBKhgPEWHqW36Xg0Bx6qwsXq9Hnew0094o",
  authDomain:"school-booking-platform.firebaseapp.com",
  projectId: "school-booking-platform",
  storageBucket: "school-booking-platform.appspot.com",
  messagingSenderId:"673281572597",
  appId:     "1:673281572597:web:fe0ceec0054560f6258fbc",
  measurementId:"G-TVQ5PK5WZF"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authSection = document.getElementById('authSection');
const portalSection = document.getElementById('portalSection');
const bookingsTable = document.getElementById('bookingsTable');
const queueTable = document.getElementById('queueTable');
const googleLogin = document.getElementById('googleLogin');
const emailLogin = document.getElementById('emailLogin');
const logoutBtn = document.getElementById('logoutBtn');

// Google SSO
googleLogin.onclick = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
// Simple email login (prompt)
emailLogin.onclick = async () => {
  const email = prompt('Enter your email:');
  const password = prompt('Enter your password:');
  if(email && password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(e) {
      alert('Login failed: ' + e.message);
    }
  }
};
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if(user) {
    authSection.classList.add('hidden');
    portalSection.classList.remove('hidden');
    loadBookings(user.email);
    loadQueue(user.email);
  } else {
    authSection.classList.remove('hidden');
    portalSection.classList.add('hidden');
  }
});

async function loadBookings(email) {
  bookingsTable.innerHTML = '<div>Loading your bookings…</div>';
  const q = query(collection(db, 'bookings'), where('studentEmail', '==', email));
  const snap = await getDocs(q);
  if(snap.empty) {
    bookingsTable.innerHTML = '<div>No bookings found.</div>';
    return;
  }
  let html = '<table class="w-full text-sm"><thead><tr><th>Date</th><th>Time</th><th>Class</th><th>Action</th></tr></thead><tbody>';
  snap.forEach(docSnap => {
    const d = docSnap.data();
    html += `<tr><td>${d.date}</td><td>${d.time}</td><td>${d.studentClass||''}</td><td><button data-id="${docSnap.id}" class="cancelBtn text-red-600">Cancel</button></td></tr>`;
  });
  html += '</tbody></table>';
  bookingsTable.innerHTML = html;
  bookingsTable.querySelectorAll('.cancelBtn').forEach(btn => {
    btn.onclick = async () => {
      if(confirm('Cancel this booking?')) {
        await deleteDoc(doc(db, 'bookings', btn.dataset.id));
        loadBookings(email);
        loadQueue(email);
      }
    };
  });
}

async function loadQueue(email) {
  queueTable.innerHTML = '<div>Loading your queue…</div>';
  const q = query(collection(db, 'waiting_list'), where('studentEmail', '==', email), orderBy('createdAt'));
  const snap = await getDocs(q);
  if(snap.empty) {
    queueTable.innerHTML = '<div>No queue entries found.</div>';
    return;
  }
  let html = '<table class="w-full text-sm"><thead><tr><th>Date</th><th>Time</th><th>Class</th><th>Position</th></tr></thead><tbody>';
  snap.forEach((docSnap, idx) => {
    const d = docSnap.data();
    html += `<tr><td>${d.date}</td><td>${d.time}</td><td>${d.studentClass||''}</td><td>${idx+1}</td></tr>`;
  });
  html += '</tbody></table>';
  queueTable.innerHTML = html;
}

// Request Access (BINUSIAN passwordless)
const requestAccessBtn = document.getElementById('requestAccessBtn');
const requestEmailInput = document.getElementById('requestEmail');
const requestStatus = document.getElementById('requestStatus');

if (requestAccessBtn) {
  requestAccessBtn.onclick = async () => {
    const email = requestEmailInput.value.trim();
    if (!email) {
      requestStatus.textContent = 'Please enter a valid email address.';
      requestStatus.className = 'text-sm text-center mt-1 text-accent-600';
      return;
    }
    requestStatus.textContent = 'Requesting access...';
    requestStatus.className = 'text-sm text-center mt-1 text-secondary-600';
    try {
      const res = await fetch('http://localhost:5000/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        requestStatus.textContent = 'Access granted! Check your email for your password.';
        requestStatus.className = 'text-sm text-center mt-1 text-green-600';
      } else {
        requestStatus.textContent = data.message || 'Request failed.';
        requestStatus.className = 'text-sm text-center mt-1 text-accent-600';
      }
    } catch (e) {
      requestStatus.textContent = 'Network error. Please try again.';
      requestStatus.className = 'text-sm text-center mt-1 text-accent-600';
    }
  };
}
