const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware');
const firebaseAuthController = require('../controllers/firebase-auth-controller');
const postController = require('../controllers/post-controller');

router.post('/api/register', firebaseAuthController.registerUser);
router.post('/api/login', firebaseAuthController.loginUser);
router.post('/api/logout', verifyToken,firebaseAuthController.logoutUser);
router.post('/api/reset-password', firebaseAuthController.resetPassword);

// Example of a protected route
router.get('/api/posts', verifyToken, postController.getPosts);

module.exports = router;
