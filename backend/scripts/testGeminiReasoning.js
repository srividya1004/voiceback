require('dotenv').config();
const axios = require('axios');

async function testGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const models = [
    'gemini-3.6-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.5-transcribe'
  ];

  for (const model of models) {
    console.log(`📡 Querying Google Gemini model: "${model}"...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  text: `Caregiver Question: "Do you want some water?"
Language: English (en)
Generate 3 short patient response options in JSON format:
{
  "question": "Do you want some water?",
  "language": "en",
  "intentContext": "hydration",
  "options": [
    { "id": "opt_1", "intent": "WATER_REQUEST", "text": "Yes, please give me water." },
    { "id": "opt_2", "intent": "NO", "text": "No, I am not thirsty." },
    { "id": "opt_3", "intent": "HELP", "text": "I need help." }
  ]
}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      console.log(`✅ SUCCESS with Gemini Model "${model}"! Output:\n`, response.data.candidates[0].content.parts[0].text);
      return model;
    } catch (err) {
      console.log(`❌ Model "${model}" returned:`, err.response?.status, err.response?.data?.error?.message || err.message);
    }
  }
}

testGeminiModels();
