// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCu6fuECK7OVHxvy0CK5G5lmL9KyDqNWkM",
  authDomain: "facturacion-izar.firebaseapp.com",
  projectId: "facturacion-izar",
  storageBucket: "facturacion-izar.firebasestorage.app",
  messagingSenderId: "873464345399",
  appId: "1:873464345399:web:ac9ae2ed8b735a3fada0b2",
  measurementId: "G-YWJD270EZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
