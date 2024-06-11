const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/files");

class GeminiConfig {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.fileManager = new GoogleAIFileManager(this.apiKey);

    this.visionModel = this.genAI.getGenerativeModel({
      model: "gemini-1.0-pro-vision-latest",
    });

    this.textModel = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    this.generationConfig = {
      temperature: 0.5,
      topP: 0.95,
      topK: 32,
      maxOutputTokens: 1024,
      responseMimeType: "text/plain",
    };
  }
}

const apiKey = process.env.GEMINI_API_KEY;
const geminiConfig = new GeminiConfig(apiKey);

module.exports = geminiConfig;
