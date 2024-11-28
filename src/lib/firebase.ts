import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_Jbhm8aRbbYyqiANLZhXRXml9s8wEkpU",
  authDomain: "voting-82870.firebaseapp.com",
  databaseURL: "https://voting-82870-default-rtdb.firebaseio.com",
  projectId: "voting-82870",
  storageBucket: "voting-82870.firebasestorage.app",
  messagingSenderId: "993100353540",
  appId: "1:993100353540:web:887e02598788fc1767e551",
  measurementId: "G-EW60DKGGXE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);