import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB7zm5e32PT90bwnFOZnEaEM76tn-77Y80",
  authDomain: "chatfirebase-d2278.firebaseapp.com",
  projectId: "chatfirebase-d2278",
  storageBucket: "chatfirebase-d2278.appspot.com",
  messagingSenderId: "534594852850",
  appId: "1:534594852850:web:7856ac1ba4ec2d0a4ebd6b",
  measurementId: "G-YG1YK2NKMT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
