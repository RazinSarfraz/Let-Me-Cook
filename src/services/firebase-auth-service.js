const firebaseConfig = require('../config/firebase');
const bcrypt = require('bcrypt');

const auth = firebaseConfig.getAuth();


class FirebaseAuthService {
    async registerUser(email, password, userName, phone) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Run Firestore transaction
            await firebaseConfig.db.runTransaction(async (transaction) => {
                // Create the user with Firebase Auth
                const userCredential = await firebaseConfig.createUserWithEmailAndPassword(auth, email, password);

                // Send email verification
                await firebaseConfig.sendEmailVerification(auth.currentUser);

                // Save user info in Firestore
                transaction.set(firebaseConfig.db.collection('users').doc(userCredential.user.uid), {
                    userName,
                    email,
                    password: hashedPassword,
                    phone,
                    createdAt: new Date().toISOString()
                });
            });

            return { message: "Verification email sent! User created successfully!" };
        } catch (error) {
            throw new Error(error.message || "An error occurred while registering user");
        }
    }

    async loginWithGoogle(idToken) {
        try {
            // Verify the Google ID token
            const credential = firebaseConfig.GoogleAuthProvider.credential(idToken);
            const userCredential = await firebaseConfig.signInWithCredential(auth, credential);

            // Save user info in Firestore
            const { uid, email, displayName, photoURL } = userCredential.user;
            await firebaseConfig.db.collection('users').doc(uid).set({
                userName: displayName,
                email: email,
                photoURL: photoURL,
                createdAt: new Date().toISOString(),
            });

            // Return success message or user data
            return { message: "User logged in with Google successfully", user: userCredential.user };
        } catch (error) {
            throw new Error(error.message || "An error occurred while logging in with Google");
        }
    }

    async loginUser(email, password) {
        try {
            const userCredential = await firebaseConfig.signInWithEmailAndPassword(auth, email, password);
            const idToken = userCredential._tokenResponse.idToken;
            if (!idToken) throw new Error("Internal Server Error");
            return { idToken, userCredential };
        } catch (error) {
            throw new Error(error.message || "An error occurred while logging in");
        }
    }

    async logoutUser() {
        try {
            await firebaseConfig.signOut(auth);
            return { message: "User logged out successfully" };
        } catch (error) {
            throw new Error("Internal Server Error");
        }
    }

    async resetPassword(email) {
        try {
            // Check if the user with the provided email exists in Firestore
            const usersRef = firebaseConfig.db.collection('users');
            const querySnapshot = await usersRef.where('email', '==', email).get();

            if (querySnapshot.empty) {
                throw new Error('No user found with the provided email');
            }

            await firebaseConfig.sendPasswordResetEmail(auth, email);
            return { message: "Password reset email sent successfully!" };
        } catch (error) {
            throw new Error(error.message || "An error occurred while sending password reset email");
        }
    }
}

module.exports = new FirebaseAuthService();
