const firebaseService = require('./firebaseService');

class UserService {
    /**
     * Retrieves the history of a user by their user ID.
     *
     * @param {string} userId - The ID of the user whose history is being retrieved.
     * @returns {Promise<Object>} - A promise that resolves to the user's history data.
     * @throws {Error} - Throws an error if fetching the user's history fails.
     */
    async getUserHistory(userId) {
        try {
            const result = await firebaseService.getAllUserData(userId);
            return result;
        } catch (error) {
            throw new Error('Failed to get user history');
        }
    }

    /**
     * Deletes an image by its ID if it belongs to the specified user.
     *
     * @param {string} imageId - The ID of the image to be deleted.
     * @param {string} userId - The ID of the user attempting to delete the image.
     * @returns {Promise<Object>} - A promise that resolves to the result of the deletion operation.
     * @throws {Error} - Throws an error if the image is not found or if an error occurs during deletion.
     */
    async deleteImageById(imageId, userId) {
        // Fetch the image by its ID
        const image = await firebaseService.getImageById(imageId);

        // Check if the image exists
        if (!image) {
            throw new Error('Image not found');
        }

        // Check if the image belongs to the specified user
        if (image.userId !== userId) {
            throw new Error('Image not found');
        }

        try {
            // Delete the image by its ID
            const result = await firebaseService.deleteImageById(imageId);
            return result;
        } catch (error) {
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}

module.exports = new UserService();
