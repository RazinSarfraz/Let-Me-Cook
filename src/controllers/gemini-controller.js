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
        const { items, imageId } = req.body;
        const userId = req.user.uid;

        // Validation checks
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Items should not be empty' });
        }
        if (!imageId || imageId.trim() === '') {
            return res.status(400).json({ error: 'Image ID should not be empty' });
        }

        try {
            const result = await geminiService.processIngredients(items, userId, imageId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new GeminiController();
