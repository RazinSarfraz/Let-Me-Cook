const { storage, db ,admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Uploads a file to Firebase Storage and returns the public URL.
 *
 * @param {string} filePath - The file path of the image.
 * @param {string} userId - The user ID.
 * @returns {Promise<string>} - The URL of the uploaded file.
 */
async function uploadToFirebaseStorage(filePath, userId) {
  const metadata = {
    metadata: {
      firebaseStorageDownloadTokens: uuidv4(),
    },
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
  };

  const storagePath = `images/${userId}/${path.basename(filePath)}`;
  const [file] = await storage.upload(filePath, {
    gzip: true,
    metadata: metadata,
    destination: storagePath,
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
  return url;
}

/**
 * Saves image metadata to Firestore.
 *
 * @param {string} userId - The user ID.
 * @param {string} fileName - The name of the file.
 * @param {string} fileUri - The URI of the file.
 * @returns {Promise<void>}
 */
async function saveImageMetadata(userId, fileName, fileUri) {
  const collectionRef = db.collection('imageUploads');
  const documentRef = collectionRef.doc();

  await documentRef.set({
    userId,
    fileName,
    fileUri,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = {
  uploadToFirebaseStorage,
  saveImageMetadata,
};
