/**
 * Closeness Scorer Utility
 * Calculates a word-level edit-distance similarity score (0–100) between
 * the target personal script and the patient's reconstructed speech.
 * 
 * Pure JavaScript, dependency-free implementation.
 */

/**
 * Normalize and tokenize a sentence into an array of word tokens
 * @param {String} text
 * @returns {Array<String>} Array of lowercased, punctuation-free word tokens
 */
const tokenizeSentence = (text) => {
  if (!text || typeof text !== 'string') return [];

  return text
    .toLowerCase()
    // Strip common ASCII and Unicode punctuation (including Indic danda '।', quotes, brackets, etc.)
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”«»।॥?!\\]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
};

/**
 * Compute Levenshtein edit distance between two token arrays
 * @param {Array<String>} tokensA
 * @param {Array<String>} tokensB
 * @returns {Number} Edit distance (insertions, deletions, substitutions)
 */
const tokenLevenshteinDistance = (tokensA, tokensB) => {
  const m = tokensA.length;
  const n = tokensB.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row space optimization
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const tokenA = tokensA[i - 1];

    for (let j = 1; j <= n; j++) {
      const tokenB = tokensB[j - 1];
      const cost = tokenA === tokenB ? 0 : 1;

      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      );
    }

    // Swap rows
    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j];
    }
  }

  return prevRow[n];
};

/**
 * Calculate closeness score (0–100) comparing target text against reconstructed text
 * @param {String} targetText - The target PersonalScript text
 * @param {String} reconstructedText - The patient's interpreted/reconstructed utterance
 * @returns {Number} Integer score between 0 and 100
 */
const calculateCloseness = (targetText, reconstructedText) => {
  const targetTokens = tokenizeSentence(targetText);
  const reconTokens = tokenizeSentence(reconstructedText);

  // Safe handling of empty cases
  if (targetTokens.length === 0 && reconTokens.length === 0) {
    return 100;
  }
  if (targetTokens.length === 0 || reconTokens.length === 0) {
    return 0;
  }

  const maxTokens = Math.max(targetTokens.length, reconTokens.length);
  const editDistance = tokenLevenshteinDistance(targetTokens, reconTokens);

  const similarity = Math.max(0, 1 - editDistance / maxTokens);
  const score = Math.round(similarity * 100);

  return Math.max(0, Math.min(100, score));
};

module.exports = {
  calculateCloseness,
  tokenizeSentence,
  tokenLevenshteinDistance
};
