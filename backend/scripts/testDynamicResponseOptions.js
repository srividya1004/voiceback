/**
 * VoiceBack Dynamic Response Option Generator Test
 * Demonstrates generating tailored response choices on the basis of any arbitrary user input
 * across English (en), Kannada (kn), and Hindi (hi).
 */

require('dotenv').config();
const contextEngineService = require('../src/services/contextEngineService');

async function testDynamicResponseOptions() {
  console.log('========================================================================');
  console.log('💡 VoiceBack Dynamic Response Option Generation on User Input');
  console.log('========================================================================');

  const sampleUserInputs = [
    {
      category: '1. Hydration / Water',
      promptEn: 'Do you want something to drink or some water?',
      promptKn: 'ನಿಮಗೆ ಕುಡಿಯಲು ನೀರು ಬೇಕೇ?',
      promptHi: 'क्या आप पानी पीना चाहते हैं?'
    },
    {
      category: '2. Comfort & Pain',
      promptEn: 'Are you feeling any pain or discomfort right now?',
      promptKn: 'ನಿಮಗೆ ಎಲ್ಲಾದರೂ ನೋವು ಇದೆಯೇ?',
      promptHi: 'क्या आपको कहीं दर्द हो रहा है?'
    },
    {
      category: '3. Food & Hunger',
      promptEn: 'Are you hungry? What would you like to eat?',
      promptKn: 'ನಿಮಗೆ ಹಸಿವಾಗಿದೆಯೇ? ಊಟ ಮಾಡಬೇಕೇ?',
      promptHi: 'क्या आपको भूख लगी है? क्या खाना चाहेंगे?'
    },
    {
      category: '4. Rest & Sleep',
      promptEn: 'Would you like to lie down and rest for a bit?',
      promptKn: 'ನೀವು ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಬಯಸುತ್ತೀರಾ?',
      promptHi: 'क्या आप थोड़ी देर आराम करना चाहते हैं?'
    }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'hi', name: 'Hindi (हिंदी)' }
  ];

  for (const item of sampleUserInputs) {
    console.log(`\n========================================================================`);
    console.log(`📌 Category: ${item.category}`);
    console.log(`========================================================================`);

    for (const lang of languages) {
      const userPrompt = lang.code === 'en' ? item.promptEn : lang.code === 'kn' ? item.promptKn : item.promptHi;

      console.log(`\n🌐 Language: ${lang.name} (${lang.code.toUpperCase()})`);
      console.log(`📥 User Input Prompt: "${userPrompt}"`);

      try {
        const result = await contextEngineService.generateResponseOptions({
          question: userPrompt,
          language: lang.code
        });

        console.log(`🧠 Recognized Context Intent: "${result.intentContext || 'DYNAMIC_INTENT'}"`);
        console.log(`📋 Generated Response Choices:`);
        result.options.forEach((opt, idx) => {
          console.log(`   [Option ${idx + 1}] "${opt.text}" (Intent Code: ${opt.intent})`);
        });

      } catch (err) {
        console.error(`❌ Error generating options for ${lang.name}:`, err.message);
      }
    }
  }

  console.log('\n========================================================================');
  console.log('🎉 DYNAMIC RESPONSE OPTION GENERATION DEMONSTRATED SUCCESSFULLY!');
  console.log('========================================================================');
}

testDynamicResponseOptions();
