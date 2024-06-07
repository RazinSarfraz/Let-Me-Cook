const { fileManager, visionModel, generationConfig } = require('../config/gemini');
const { storage, db } = require('../config/firebase')
const fs = require('fs');
const admin = require('firebase-admin');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


/**
 * Uploads the given file to Gemini.
 *
 * @param {string} path - The file path to upload.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<Object>} - The uploaded file object.
 */
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

/**
 * Runs the generative AI model with a given file and prompt.
 *
 * @param {Object} file - The uploaded file object.
 * @param {string} prompt - The prompt to send to the generative AI model.
 * @returns {Promise<string>} - The result from the AI model.
 */
async function runWithImagePrompt(file, prompt) {
  const parts = [
    { text: prompt },
    { text: "Image: " },
    {
      fileData: {
        mimeType: file.mimeType,
        fileUri: file.uri,
      },
    },
    { text: "List of Objects: " },
  ];

  const result = await visionModel.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
  });

  return result.response.text();
}

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

/**
 * Processes the image by uploading it to Gemini and running the prompt.
 *
 * @param {string} filePath - The file path of the image.
 * @param {string} mimeType - The MIME type of the image.
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} - The result from the AI model.
 */
async function processImage(filePath, mimeType, userId) {
  try {
    const file = await uploadToGemini(filePath, mimeType);
    // const prompt = `
    // You must extract only the food items and ingredients in the provided image and output them in a list in alphabetical order.
    // Your response must always be in the following format:
    // "item1, item2, item3, item4, ..."
    // If there are no items return an empty list.
    // `;

    const prompt = `
    Analyze the provided image and accurately detect and identify all visible food items and ingredients.
    Exclude any non-food objects and background elements.
    If there are no food item or ingredient detected then return an empty list.
    Provide only the labels for each identified food item and ingredient.
    The response must always be in the following format:
    "item1, item2, item3, item4, ...". 
    `;
    const result = await runWithImagePrompt(file, prompt);

    // Process the result into an array of items
    const items = result.split(',').map(item => item.trim()).filter(item => item !== '');
    // Prepare the response
    const response = {
      items: items
    };

    // Upload image to Firebase Storage and save metadata
    const fileUri = await uploadToFirebaseStorage(filePath, userId);
    await saveImageMetadata(userId, path.basename(filePath), fileUri);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    return response;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Error processing image');
  }
}

module.exports = {
  uploadToGemini,
  runWithImagePrompt,
  processImage,
};
