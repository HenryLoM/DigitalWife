import vader from './vader-sentiment.js';  // Custom local version of vader-sentiment

const blushedKeywords = new Set([
    "awkward", "bashful", "blush", "blushed", "embarrassed", "flattered", "shy"
]);

/**
 * Infers emotion and blush state from text.
 * 
 * @param {string} text         - Text to analyze.
 * @returns {[string, boolean]} - Emotion label and blush flag.
 */
export function inferEmotion(text) {
    const lowerText = text.toLowerCase();
    const isBlushed = [...blushedKeywords].some(word => lowerText.includes(word));

    const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    const score = result.compound;  // Normalized sentiment score

    let baseEmotion = "neutral";
    if (score >= 0.8) baseEmotion = "happy 2";
    else if (score >= 0.6) baseEmotion = "happy 1";
    else if (score >= 0.5) baseEmotion = "smile 2";
    else if (score >= 0.3) baseEmotion = "smile 1";
    else if (score >= 0.1) baseEmotion = "neutral";
    else if (score >= -0.2) baseEmotion = "annoyed";
    else if (score >= -0.4) baseEmotion = "angry";
    else if (score >= -0.6) baseEmotion = "sad";

    return [baseEmotion, isBlushed];
}
