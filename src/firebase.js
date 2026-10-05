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
    apiKey: "AIzaSyAl21_n_-ARdx1IveZW4DVSEW4ZKlZRjTI",
  authDomain: "frank-ad1d8.firebaseapp.com",
  projectId: "frank-ad1d8",
  storageBucket: "frank-ad1d8.firebasestorage.app",
  messagingSenderId: "474583116258",
  appId: "1:474583116258:web:a7ea46072a080a6a58b1bb",
  measurementId: "G-GQ4DN576ME"
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
