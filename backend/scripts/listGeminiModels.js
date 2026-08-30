require('dotenv').config();
const axios = require('axios');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Fetching available models for key:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING');

  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, { timeout: 10000 });
    console.log('✅ Available Models:');
    const models = res.data?.models || [];
    models.forEach(m => {
      if (m.supportedGenerationMethods?.includes('generateContent')) {
        console.log(` - Name: ${m.name} | Display: ${m.displayName}`);
      }
    });
  } catch (err) {
    console.error('❌ Failed to list models:', err.response?.status, err.response?.data?.error?.message || err.message);
  }
}

listModels();
