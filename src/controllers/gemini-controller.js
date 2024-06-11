const geminiService = require('../services/geminiService');


class GeminiController {
    async processImage(req, res) {
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;
        const userId = req.user.uid;

        try {
            const result = await geminiService.processImage(filePath, mimeType, userId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to process image' });
        }
    }

    async processIngredients(req, res) {
        const items = req.body
        console.log(items);
        res.json(items);
    }
}

module.exports = new GeminiController();
