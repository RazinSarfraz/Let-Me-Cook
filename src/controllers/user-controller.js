const userService = require('../services/userService')

class UserController {
    async getHistory(req, res) {
        try {
            const userId = req.user.uid;
            const result = await userService.getUserHistory(userId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get user history' });
        }
    }

    async deleteImageById(req, res) {
        try {
            const imageId = req.body.imageId;
            const userId = req.user.uid;
            if (!imageId || imageId.trim() === '') {
                return res.status(400).json({ error: 'Image ID should not be empty' });
            }
            await userService.deleteImageById(imageId, userId);
            res.json({ message: 'Image deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

}

module.exports = new UserController();
