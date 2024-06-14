const uploadImagePrompt = ` Analyze the provided image and accurately detect and identify all visible food items and ingredients.
          Exclude any non-food objects and background elements.
          If there are no food item or ingredient detected then return an empty list.
          Provide only the labels for each identified food item and ingredient.
          Your output must always be in the following format:
          "item1, item2, item3, item4, ...". `

async function getProcessIngredientsPrompt(items) {
    const prompt = `
            Here is a list of ingredients: ${items}.
            Please suggest recipes that can be made using strictly these ingredients you must not add any other ingredients outside of the provided list.
            You must skip items in the list that are not a food item or ingredient and must not include them in the response
            The response must be in the following JSON format:
            {
                "generalDescription": "<small description from gemini>",
                "recipes": [
                    {
                        "title": "recipe name",
                        "recipe": [
                            "step 1",
                            "step 2",
                            "step 3",
                            ".",
                            ".",
                            "step n"
                        ],
                        "estimatedCalories": "<example: 300-400>"
                    },
                    {
                        "title": "recipe name",
                        "recipe": [
                            "step 1",
                            "step 2",
                            "step 3",
                            ".",
                            ".",
                            "step n"
                        ],
                        "estimatedCalories": "<example: 500-700>"
                    }
                ]
            }
        `
    return prompt
}


module.exports = {
    uploadImagePrompt,
    getProcessIngredientsPrompt
}