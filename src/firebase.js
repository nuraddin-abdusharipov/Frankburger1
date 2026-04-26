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
    apiKey: "AIzaSyAwj1VFbqzhB-S4SQFpdjjvrrZYuOfwi3k",
    authDomain: "frankburger-cec89.firebaseapp.com",
    projectId: "frankburger-cec89",
    storageBucket: "frankburger-cec89.firebasestorage.app",
    messagingSenderId: "258948329964",
    appId: "1:258948329964:web:3f97c97ab088bbece4d0c9",
    measurementId: "G-NWPGL7P057"
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