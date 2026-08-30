require('dotenv').config();
const contextEngineService = require('../src/services/contextEngineService');

async function testOpenDomainReasoning() {
  console.log('=======================================================');
  console.log('🧠 VOICEBACK DYNAMIC OPEN-DOMAIN AI REASONING TEST');
  console.log('=======================================================');

  const testQuestions = [
    { lang: 'en', question: 'Do you want to watch the news on TV or listen to music?' },
    { lang: 'kn', question: 'ನಿಮಗೆ ಟಿವಿ ನೋಡಬೇಕೇ ಅಥವಾ ವಿಶ್ರಾಂತಿ ಪಡೆಯಬೇಕೇ?' },
    { lang: 'hi', question: 'क्या आप चाय पीना चाहते हैं या थोड़ा टहलना चाहते हैं?' },
    { lang: 'en', question: 'What time did you wake up this morning?' }
  ];

  for (const qObj of testQuestions) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`📥 Input Question (${qObj.lang.toUpperCase()}): "${qObj.question}"`);
    
    const result = await contextEngineService.generateResponseOptions({
      question: qObj.question,
      language: qObj.lang
    });

    console.log(`✅ Recognized Context Intent: "${result.intentContext}"`);
    console.log(`💡 Dynamic Generated Response Choices:`);
    result.options.forEach((opt, idx) => {
      console.log(`   [${idx + 1}] "${opt.text}" (Intent: ${opt.intent || opt.semanticIntent})`);
    });
  }

  console.log('\n=======================================================');
  console.log('🎉 OPEN-DOMAIN AI REASONING TEST COMPLETED!');
  console.log('=======================================================');
}

testOpenDomainReasoning();
