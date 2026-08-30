/**
 * VoiceBack Gemini Voice Recognition & Multimodal Response Engine Test
 */

require('dotenv').config();
const axios = require('axios');

async function testGemini() {
  console.log('========================================================================');
  console.log('🧠 Testing Google Gemini Multimodal Voice Recognition & Response Engine');
  console.log('========================================================================');

  const apiKey = process.env.GEMINI_API_KEY;
  console.log(`🔑 Gemini API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);

  // Test models: gemini-1.5-flash, gemini-2.5-flash
  const modelsToTest = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-exp'];

  for (const model of modelsToTest) {
    console.log(`\n📡 Testing Model: "${model}"...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  text: 'You are Gemini VoiceBack AI Engine. Generate 3 short, natural, patient-friendly response options in English, Kannada, and Hindi for the question: "Are you hungry?" Return JSON format.'
                }
              ]
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`✅ SUCCESS with model ${model}! Response sample:\n`, text?.substring(0, 250));
      return model;
    } catch (err) {
      console.log(`❌ Model ${model} returned:`, err.response?.status, err.response?.data?.error?.message || err.message);
    }
  }
}

testGemini();
