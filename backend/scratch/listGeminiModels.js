require('dotenv').config();
const axios = require('axios');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const res = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    console.log('✅ Available Models:');
    res.data.models.forEach(m => console.log(' -', m.name));
  } catch (err) {
    console.error('ListModels Error:', err.response?.data || err.message);
  }
}

listModels();
