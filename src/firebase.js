import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBf0VbVn-RmEvWb5HPIItQWnOGuOteSdf4",
  authDomain: "envios-15006.firebaseapp.com",
  projectId: "envios-15006",
  storageBucket: "envios-15006.firebasestorage.app",
  messagingSenderId: "145463681546",
  appId: "1:145463681546:web:7db3d2a6af422c9655f5f3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
