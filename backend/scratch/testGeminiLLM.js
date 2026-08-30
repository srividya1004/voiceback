require('dotenv').config();
const axios = require('axios');

async function testLLM() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key present:', !!apiKey);

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          { parts: [{ text: 'Generate 3 Kannada response options for caregiver question: "ಬೆಳಿಗ್ಗೆ ಎಷ್ಟು ಹೊತ್ತಿಗೆ ಎದ್ದೆ?". Return ONLY valid JSON format: { "options": [{ "id": "opt_1", "intent": "WAKE_6AM", "text": "ನಾನು ಬೆಳಿಗ್ಗೆ 6 ಗಂಟೆಗೆ ಎದ್ದೆ." }] }' }] },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      }
    );
    console.log('✅ Gemini LLM Response:\n', res.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error('Gemini API Error:', err.response?.data || err.message);
  }
}

testLLM();
