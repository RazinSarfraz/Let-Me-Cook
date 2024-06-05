const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    db
} = require('../config/firebase');
const bcrypt = require('bcrypt');

const auth = getAuth();

class FirebaseAuthService {
    async registerUser(email, password, userName, phone) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Run Firestore transaction
            await db.runTransaction(async (transaction) => {
                // Create the user with Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Send email verification
                await sendEmailVerification(auth.currentUser);

                // Save user info in Firestore
                transaction.set(db.collection('users').doc(userCredential.user.uid), {
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

    async loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = userCredential._tokenResponse.idToken;
            if (!idToken) throw new Error("Internal Server Error");
            return { idToken, userCredential };
        } catch (error) {
            throw new Error(error.message || "An error occurred while logging in");
        }
    }

    async logoutUser() {
        try {
            await signOut(auth);
            return { message: "User logged out successfully" };
        } catch (error) {
            throw new Error("Internal Server Error");
        }
    }

    async resetPassword(email) {
        try {
            // Check if the user with the provided email exists in Firestore
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('email', '==', email).get();

            if (querySnapshot.empty) {
                throw new Error('No user found with the provided email');
            }

            await sendPasswordResetEmail(auth, email);
            return { message: "Password reset email sent successfully!" };
        } catch (error) {
            throw new Error(error.message || "An error occurred while sending password reset email");
        }
    }
}

module.exports = new FirebaseAuthService();
