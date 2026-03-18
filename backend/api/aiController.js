const { model } = require('../config/geminiConfig');

// Generate AI summary for a note
exports.generateSummary = async (req, res) => {
  try {
    const { noteContent } = req.body;

    const prompt = `Summarize the following note in 2-3 sentences: ${noteContent}`;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.status(200).json({ 
      success: true, 
      summary 
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate summary' 
    });
  }
};

// Generate tags for a note
exports.generateTags = async (req, res) => {
  try {
    const { noteContent } = req.body;

    const prompt = `Generate 3-5 relevant tags for this note (comma-separated): ${noteContent}`;
    
    const result = await model.generateContent(prompt);
    const tagsText = result.response.text();
    const tags = tagsText.split(',').map(tag => tag.trim());

    res.status(200).json({ 
      success: true, 
      tags 
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate tags' 
    });
  }
};

// Smart search assistant
exports.aiSearch = async (req, res) => {
  try {
    const { query } = req.body;

    const prompt = `Help me find notes related to: ${query}. Suggest search keywords.`;
    
    const result = await model.generateContent(prompt);
    const suggestions = result.response.text();

    res.status(200).json({ 
      success: true, 
      suggestions 
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process search' 
    });
  }
};
