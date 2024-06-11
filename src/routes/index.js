const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware');
const firebaseAuthController = require('../controllers/firebase-auth-controller');
const geminiController = require('../controllers/gemini-controller');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.post('/api/register', firebaseAuthController.registerUser);
router.post('/api/login', firebaseAuthController.loginUser);
router.post('/api/logout', verifyToken, firebaseAuthController.logoutUser);
router.post('/api/reset-password', firebaseAuthController.resetPassword);

// New route for Google login
router.post('/api/login-with-google', verifyToken, firebaseAuthController.loginWithGoogle);


router.post('/api/upload-image', verifyToken, upload.single('image'), geminiController.processImage);
router.post('/api/process-ingredients', verifyToken, geminiController.processIngredients);


module.exports = router;
