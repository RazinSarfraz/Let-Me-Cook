const geminiConfig = require('../config/gemini');
const firebaseService = require('./firebaseService');
const firebaseConfig = require('../config/firebase');
const fs = require('fs');
const path = require('path');

class GeminiService {
  /**
   * Uploads the given file to Gemini.
   *
   * @param {string} filePath - The file path to upload.
   * @param {string} mimeType - The MIME type of the file.
   * @returns {Promise<Object>} - The uploaded file object.
   */
  async uploadToGemini(filePath, mimeType) {
    const uploadResult = await geminiConfig.fileManager.uploadFile(filePath, {
      mimeType,
      displayName: filePath,
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
  async runWithImagePrompt(file, prompt) {
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
    const generationConfig = geminiConfig.generationConfig
    const result = await geminiConfig.visionModel.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
    });

    return result.response.text();
  }

  /**
   * Processes the image by uploading it to Gemini and running the prompt.
   *
   * @param {string} filePath - The file path of the image.
   * @param {string} mimeType - The MIME type of the image.
   * @param {string} userId - The user ID.
   * @returns {Promise<Object>} - The result from the AI model.
   */
  async processImage(filePath, mimeType, userId) {
    try {
      // Begin Firestore transaction
      const transaction = await firebaseConfig.db.runTransaction(async (transaction) => {
        const file = await this.uploadToGemini(filePath, mimeType);
        const prompt = `
          Analyze the provided image and accurately detect and identify all visible food items and ingredients.
          Exclude any non-food objects and background elements.
          If there are no food item or ingredient detected then return an empty list.
          Provide only the labels for each identified food item and ingredient.
          Your output must always be in the following format:
          "item1, item2, item3, item4, ...". 
        `;
        
        const result = await this.runWithImagePrompt(file, prompt);
        
        // Process the result into an array of items
        const items = result.split(',').map(item => item.trim()).filter(item => item !== '');
        // Prepare the response
        const response = {
          items: items
        };

        // Upload image to Firebase Storage and save metadata
        const fileUri = await firebaseService.uploadToFirebaseStorage(filePath, userId);
        await firebaseService.saveImageMetadata(userId, path.basename(filePath), fileUri);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        return response;
      });

      return transaction;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Error processing image');
    }
  }
}

module.exports = new GeminiService();
