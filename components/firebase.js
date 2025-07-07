// firebase.js
// Configuration object from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCx1vu-SRQuK1OdMHizP-qw5aAo-2PPrDs",
  authDomain: "inventory-app-378b4.firebaseapp.com",
  projectId: "inventory-app-378b4",
  storageBucket: "inventory-app-378b4.firebasestorage.app",
  messagingSenderId: "256438364788",
  appId: "1:256438364788:web:90b7b5e7dabe7fb48bbf21",
  measurementId: "G-0MJ4QGRHC6",
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Export Firestore DB instance
const db = firebase.firestore();
export { db };
