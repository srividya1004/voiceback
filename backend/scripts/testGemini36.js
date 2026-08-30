require('dotenv').config();
const axios = require('axios');

async function testGemini36() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = 'gemini-3.6-flash';
  console.log(`Testing recommended model: ${modelName}...`);
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const res = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: 'Caregiver Question: "Do you want tea or coffee?"\nGenerate 3 short patient answer choices in JSON format: {"options": [{"id": "opt_1", "intent": "TEA", "text": "I want tea."}]}'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    console.log(`🎉 SUCCESS with ${modelName}:`);
    console.log(res.data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error(`❌ FAILED with ${modelName}:`, err.response?.status, err.response?.data?.error?.message || err.message);
  }
}

testGemini36();
