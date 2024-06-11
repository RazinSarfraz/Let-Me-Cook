require("dotenv").config();

const firebase = require("firebase/app");
const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithCredential
} = require("firebase/auth");

const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const admin = require('firebase-admin');
const serviceAccount = require("../firebaseService.json");

class FirebaseConfig {
    constructor() {
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });

        firebase.initializeApp(firebaseConfig);

        this.getAuth = getAuth;
        this.signInWithEmailAndPassword = signInWithEmailAndPassword;
        this.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
        this.signOut = signOut;
        this.sendEmailVerification = sendEmailVerification;
        this.sendPasswordResetEmail = sendPasswordResetEmail;
        this.GoogleAuthProvider = GoogleAuthProvider;
        this.signInWithCredential = signInWithCredential;
        this.admin = admin;
        this.db = getFirestore();
        this.storage = getStorage().bucket();
    }
}

const firebaseConfig = new FirebaseConfig();

module.exports = firebaseConfig;
