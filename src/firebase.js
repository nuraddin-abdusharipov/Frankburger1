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
  apiKey: "AIzaSyC6uTuDkTnZAdZGRrHvkJlRn2sMgtxgsRs",
  authDomain: "momoning-taomlari-2.firebaseapp.com",
  projectId: "momoning-taomlari-2",
  storageBucket: "momoning-taomlari-2.firebasestorage.app",
  messagingSenderId: "470558611119",
  appId: "1:470558611119:web:c8fca746c6dbe6c4c1665a",
  measurementId: "G-K06D4RFJY1"
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
