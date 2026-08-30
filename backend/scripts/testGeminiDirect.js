require('dotenv').config();
const axios = require('axios');

async function testGeminiDirect() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing Gemini API key:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING');

  const modelsToTest = ['gemini-3.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}...`);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await axios.post(
        apiUrl,
        {
          contents: [{ parts: [{ text: 'Respond with JSON: {"status": "ok", "message": "hello"}' }] }],
          generationConfig: { responseMimeType: 'application/json' }
        },
        { timeout: 10000 }
      );
      console.log(`✅ SUCCESS with ${model}:`, res.data?.candidates?.[0]?.content?.parts?.[0]?.text);
      return model;
    } catch (err) {
      console.error(`❌ FAILED with ${model}:`, err.response?.status, err.response?.data?.error?.message || err.message);
    }
  }
}

testGeminiDirect();
