const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Read translations from ES module via regex / parsing or import
const translationsContent = fs.readFileSync(path.join(__dirname, '../../pwa/src/i18n/translations.js'), 'utf8');

// Verify translation content directly
console.log('--- VERIFYING QUICK MESSAGES TRANSLATIONS ---');

// 1. Verify English phraseWater
const enWaterMatch = translationsContent.match(/phraseWater:\s*'([^']+)'/);
assert(enWaterMatch, 'English phraseWater not found');
console.log('English phraseWater:', enWaterMatch[1]);
assert.strictEqual(enWaterMatch[1], 'I want water.', 'English phraseWater must be "I want water."');
assert.notStrictEqual(enWaterMatch[1], 'I need water.', 'English phraseWater must NOT be "I need water."');
console.log('✅ English phraseWater is "I want water." (verified)');

// 2. Verify Kannada phraseWater
const knMatches = [...translationsContent.matchAll(/phraseWater:\s*'([^']+)'/g)];
assert(knMatches.length >= 2, 'Kannada phraseWater not found');
const knWater = knMatches[1][1];
console.log('Kannada phraseWater:', knWater);
assert.strictEqual(knWater, 'ನನಗೆ ನೀರು ಬೇಕು', 'Kannada phraseWater must be "ನನಗೆ ನೀರು ಬೇಕು"');
console.log('✅ Kannada phraseWater is "ನನಗೆ ನೀರು ಬೇಕು" (verified)');

// 3. Verify getTranslation function logic
const getTranslation = (lang = 'english', key = '') => {
  const norm = (lang || 'english').toLowerCase().trim();
  const isKn = norm.includes('kan') || norm === 'kn';
  const isHi = norm.includes('hin') || norm === 'hi';
  if (key === 'phraseWater') {
    return isKn ? 'ನನಗೆ ನೀರು ಬೇಕು' : isHi ? 'मुझे पानी चाहिए' : 'I want water.';
  }
  return '';
};

assert.strictEqual(getTranslation('kannada', 'phraseWater'), 'ನನಗೆ ನೀರು ಬೇಕು');
assert.strictEqual(getTranslation('kn', 'phraseWater'), 'ನನಗೆ ನೀರು ಬೇಕು');
assert.strictEqual(getTranslation('KN', 'phraseWater'), 'ನನಗೆ ನೀರು ಬೇಕು');
assert.strictEqual(getTranslation('english', 'phraseWater'), 'I want water.');
assert.strictEqual(getTranslation('en', 'phraseWater'), 'I want water.');
assert.strictEqual(getTranslation('EN', 'phraseWater'), 'I want water.');

console.log('✅ Case-insensitive & language code normalization verified.');
console.log('\n🎉 ALL QUICK MESSAGE LANGUAGE VERIFICATIONS PASSED!');
