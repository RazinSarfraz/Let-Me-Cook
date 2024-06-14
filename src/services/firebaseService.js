const { storage, db, admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class FirebaseService {
  /**
   * Uploads a file to Firebase Storage and returns the public URL.
   *
   * @param {string} filePath - The file path of the image.
   * @param {string} userId - The user ID.
   * @returns {Promise<string>} - The URL of the uploaded file.
   */
  async uploadToFirebaseStorage(filePath, userId) {
    const metadata = {
      metadata: {
        firebaseStorageDownloadTokens: uuidv4(),
      },
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    };
    const unixTimestamp = Math.floor(Date.now() / 1000);
    const storageFileName = `${userId}_${unixTimestamp}`;
    const storagePath = `images/${userId}/${path.basename(storageFileName)}`;
    const [file] = await storage.upload(filePath, {
      gzip: true,
      metadata: metadata,
      destination: storagePath,
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
    return { url, storageFileName };
  }

  /**
   * Saves image metadata to Firestore.
   *
   * @param {string} userId - The user ID.
   * @param {string} fileName - The name of the file.
   * @param {string} fileUri - The URI of the file.
   * @returns {Promise<void>}
   */
  async saveImagedata(userId, fileName, fileUri, items) {
    const collectionRef = db.collection('imageUploads');
    const documentRef = collectionRef.doc();

    const metadata = {
      userId,
      fileName,
      items,
      fileUri,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await documentRef.set(metadata);

    // Fetch the saved document data
    const savedDoc = await documentRef.get();
    const savedData = savedDoc.data();

    // Include the document ID in the returned data
    return {
      id: documentRef.id,
      ...savedData,
    };
  }

  async getImageById(imageId) {
    try {
      const documentRef = db.collection('imageUploads').doc(imageId);
      const documentSnapshot = await documentRef.get();

      if (!documentSnapshot.exists) {
        throw new Error('Image not found');
      }

      return documentSnapshot.data();
    } catch (error) {
      console.error('Error getting image by ID:', error);
      throw new Error('Failed to get image by ID');
    }
  }

  async saveProcessedIngredients(imageId, geminiResponse) {
    const documentRef = db.collection('imageUploads').doc(imageId);

    const updateData = {
      geminiResponse,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await documentRef.update(updateData);
  }

  /**
   * Retrieves all image data from Firestore for a specific user.
   *
   * @param {string} userId - The user ID.
   * @returns {Promise<Array>} - An array of image data objects.
   */
  async getAllUserData(userId) {

    try {
      const collectionRef = db.collection('imageUploads');
      const querySnapshot = await collectionRef.where('userId', '==', userId).get();

      const imageData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const selectedData = {
          userId: data.userId,
          fileName: data.fileName,
          imageId: doc.id,
          fileUri: data.fileUri,
          items: data.items,
          geminiResponse: data.geminiResponse,
        };
        imageData.push(selectedData);
      });

      return imageData;
    } catch (error) {
      console.error('Error getting selected image data:', error);
      throw new Error('Failed to get selected image data');
    }
  }

  /**
 * Deletes a document from Firestore and its corresponding image from Firebase Storage.
 *
 * @param {string} imageId - The image ID.
 * @returns {Promise<void>}
 */
  async deleteImageById(imageId) {
    try {
      const documentRef = db.collection('imageUploads').doc(imageId);
      const docSnapshot = await documentRef.get();

      if (!docSnapshot.exists) {
        throw new Error('Image not found');
      }

      const data = docSnapshot.data();
      const { userId, fileName } = data;

      // Construct storage path
      const storagePath = `images/${userId}/${fileName}`;

      // Delete the file from Firebase Storage
      const file = storage.file(storagePath);
      await file.delete();

      // Delete the document from Firestore
      await documentRef.delete();


    } catch (error) {
      console.error('Error deleting image and document:', error);
      throw new Error('Failed to delete image and document');
    }
    return
  }

}

module.exports = new FirebaseService();
