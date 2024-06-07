const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/files");
const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const visionModel = genAI.getGenerativeModel({
  model: "gemini-1.0-pro-vision-latest",
});

const textModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.95,
  topK: 32,
  maxOutputTokens: 1024,
  responseMimeType: "text/plain",
};

module.exports = {
  fileManager,
  visionModel,
  generationConfig,
  textModel
};
