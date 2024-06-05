const FirebaseAuthService = require('../services/firebase-auth-service');

class FirebaseAuthController {
    async registerUser(req, res) {
        const { userName, email, password, phone } = req.body;
        if (!userName || !email || !password || !phone) {
            return res.status(422).json({
                userName: "Username is required",
                email: "Email is required",
                password: "Password is required",
                phone: "Phone number is required"
            });
        }
        try {
            const result = await FirebaseAuthService.registerUser(email, password, userName, phone);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async loginUser(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "Email is required",
                password: "Password is required",
            });
        }
        try {
            const { idToken, userCredential } = await FirebaseAuthService.loginUser(email, password);
            res.cookie('access_token', idToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
            res.status(200).json({ message: "User logged in successfully", userCredential });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async logoutUser(req, res) {
        try {
            const result = await FirebaseAuthService.logoutUser();
            res.clearCookie('access_token');
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async resetPassword(req, res) {
        const { email } = req.body;
        if (!email) {
            return res.status(422).json({
                email: "Email is required"
            });
        }
        try {
            const result = await FirebaseAuthService.resetPassword(email);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new FirebaseAuthController();
