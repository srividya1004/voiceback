require('dotenv').config();
const axios = require('axios');

async function testModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`Testing model: ${modelName}...`);

  try {
    const res = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: 'Caregiver Question: "Do you want tea or coffee?"\nGenerate 3 short patient answer choices in JSON: {"options": [{"id": "opt_1", "intent": "TEA", "text": "I want tea."}]}'
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

async function run() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-flash-latest');
}

run();
