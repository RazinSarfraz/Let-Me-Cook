const geminiConfig = require('../config/gemini');
const firebaseService = require('./firebaseService');
const utils = require('../utils/prompts');
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
    try {
      const uploadResult = await geminiConfig.fileManager.uploadFile(filePath, {
        mimeType,
        displayName: path.basename(filePath),
      });
      return uploadResult.file;
    } catch (error) {
      console.error('Error uploading file to Gemini:', error);
      throw new Error('Failed to upload file to Gemini');
    }
  }

  /**
   * Runs the generative AI model with a given file and prompt.
   *
   * @param {Object} file - The uploaded file object.
   * @param {string} prompt - The prompt to send to the generative AI model.
   * @returns {Promise<string>} - The result from the AI model.
   */
  async runWithImagePrompt(file, prompt) {
    try {
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
      const generationConfig = geminiConfig.generationConfig;
      const result = await geminiConfig.visionModel.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
      });

      return result.response.text();
    } catch (error) {
      console.error('Error running AI model with image prompt:', error);
      throw new Error('Failed to run AI model with image prompt');
    }
  }

  /**
   * Processes the image by uploading it to Gemini, running the AI model with a prompt,
   * saving image data to Firebase, and cleaning up the local file.
   *
   * @param {string} filePath - The file path of the image.
   * @param {string} mimeType - The MIME type of the image.
   * @param {string} userId - The user ID.
   * @returns {Promise<Object>} - The processed image data.
   */
  async processImage(filePath, mimeType, userId) {
    try {
      // Upload image to Gemini
      const file = await this.uploadToGemini(filePath, mimeType);

      // Run AI model with image prompt
      const prompt = utils.uploadImagePrompt;
      const result = await this.runWithImagePrompt(file, prompt);

      // Process AI model response
      const items = result.split(',').map(item => item.trim()).filter(item => item !== '');

      // Upload image data to Firebase Storage
      const { url, storageFileName } = await firebaseService.uploadToFirebaseStorage(filePath, userId);

      // Save image data to Firebase Firestore
      const savedImage = await firebaseService.saveImagedata(userId, path.basename(storageFileName), url, items);

      // Remove uploaded file
      fs.unlinkSync(filePath);

      return { imageData: savedImage };
    } catch (error) {
      throw new Error('Error processing image: ' + error.message);
    }
  }

  /**
   * Processes the ingredients by running a generative AI model with a prompt
   * and returns the processed response.
   *
   * @param {string[]} items - Array of ingredients.
   * @param {string} userId - The user ID.
   * @param {string} imageId - The image ID.
   * @returns {Promise<Object>} - The processed ingredients response.
   */
  async processIngredients(items, userId, imageId) {
    try {
      // Get image data from Firebase
      const image = await firebaseService.getImageById(imageId);
      if (!image) {
        throw new Error('Image not found');
      }
      if (image.userId !== userId) {
        throw new Error('Image not found');
      }
      // Generate AI model prompt for processing ingredients
      const prompt = await utils.getProcessIngredientsPrompt(items);
      const result = await geminiConfig.textModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Extract and parse JSON response
      text = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const parsedResponse = JSON.parse(text);

      // Save processed ingredients to Firebase
      await firebaseService.saveProcessedIngredients(imageId, parsedResponse);

      return parsedResponse;
    } catch (error) {
      throw new Error('Error: ' + error.message);
    }
  }
}

module.exports = new GeminiService();
