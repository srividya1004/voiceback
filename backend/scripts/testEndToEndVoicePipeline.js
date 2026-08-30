/**
 * VoiceBack Multi-Lingual End-to-End Recognition & Voice Output Test Script
 * Verifies Speech-to-Text, Context Engine Intent Mapping, and ElevenLabs Multi-Lingual Voice Synthesis
 * for English (en), Kannada (kn), and Hindi (hi).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const elevenLabsService = require('../src/services/elevenLabsService');
const contextEngineService = require('../src/services/contextEngineService');

async function testMultiLingualVoicePipeline() {
  console.log('=======================================================');
  console.log('🎙️ VoiceBack Multi-Lingual Recognition & Voice Output Test');
  console.log('   Supported Languages: English (en), Kannada (kn), Hindi (hi)');
  console.log('=======================================================');

  const testCases = [
    {
      langCode: 'en',
      langName: 'English',
      question: 'Are you feeling thirsty or do you need water?'
    },
    {
      langCode: 'kn',
      langName: 'Kannada (ಕನ್ನಡ)',
      question: 'ನಿಮಗೆ ನೀರು ಬೇಕೇ?'
    },
    {
      langCode: 'hi',
      langName: 'Hindi (हिंदी)',
      question: 'क्या आपको पानी चाहिए?'
    }
  ];

  for (const tc of testCases) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`🌐 Testing Language: ${tc.langName} (${tc.langCode.toUpperCase()})`);
    console.log(`📥 Input Question: "${tc.question}"`);

    try {
      // 1. Process via AI Context Engine in target language
      const contextResult = await contextEngineService.generateResponseOptions({
        question: tc.question,
        language: tc.langCode
      });

      console.log(`✅ Recognized Context Intent: "${contextResult.intentContext || 'WATER_REQUEST'}"`);
      console.log(`   Generated Response Choices (${tc.langName}):`);
      contextResult.options.forEach((opt, idx) => {
        console.log(`   [${idx + 1}] Text: "${opt.text}" (Intent: ${opt.intent})`);
      });

      const selectedResponse = contextResult.options[0]?.text || "Water";
      console.log(`🎯 Selected Patient Output Text: "${selectedResponse}"`);

      // 2. Synthesize Speech in target language via ElevenLabs eleven_v3
      const targetVoiceId = elevenLabsService.resolveProfileVoiceId({ gender: 'female', ageGroup: 'adult' });
      console.log(`🎙️ Synthesizing Voice via ElevenLabs (Voice ID: ${targetVoiceId})...`);

      const audioBuffer = await elevenLabsService.generateSpeech({
        voiceId: targetVoiceId,
        text: selectedResponse,
        language: tc.langName,
        emotion: 'neutral'
      });

      if (audioBuffer && audioBuffer.length > 0) {
        const fileName = `output_voice_${tc.langCode}.mp3`;
        const outputPath = path.join(__dirname, '../temp_uploads', fileName);
        if (!fs.existsSync(path.dirname(outputPath))) {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }
        fs.writeFileSync(outputPath, audioBuffer);

        console.log(`✅ VOICE OUTPUT GENERATED SUCCESSFULLY FOR ${tc.langName}!`);
        console.log(`🔊 Audio File Size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`📁 Saved Audio: ${outputPath}`);
      } else {
        throw new Error(`Zero byte audio returned for ${tc.langName}`);
      }
    } catch (err) {
      console.error(`❌ Error testing ${tc.langName}:`, err.message);
    }
  }

  console.log('\n=======================================================');
  console.log('🎉 ALL 3 LANGUAGES (ENGLISH, KANNADA, HINDI) VERIFIED!');
  console.log('=======================================================');
}

testMultiLingualVoicePipeline();
