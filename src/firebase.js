import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDHRB1Kug-xJEeLT0RvX0s2cdQ4v_7rblg",
  authDomain: "frankburger-ab84a.firebaseapp.com",
  projectId: "frankburger-ab84a",
  storageBucket: "frankburger-ab84a.firebasestorage.app",
  messagingSenderId: "393206485013",
  appId: "1:393206485013:web:0e8c2a7cffee83d79cfe1c",
  measurementId: "G-0YCW4YDKE2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const ordersCollection = collection(db, 'orders');
const usersCollection = collection(db, 'users');
const productsCollection = collection(db, 'products');
const settingsCollection = collection(db, 'settings');

export {
    db,
    storage,
    ordersCollection,
    usersCollection,
    productsCollection,
    settingsCollection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    ref,
    uploadBytes,
    getDownloadURL
};
