// Text-to-Speech utility
// For mobile: Uses expo-speech if available, otherwise Web Speech API for web
let Speech: any = null;

// Try to import expo-speech
try {
  Speech = require('expo-speech');
} catch (e) {
  // expo-speech not available, will use Web Speech API for web
}

export const speak = (text: string, options?: { language?: string; pitch?: number; rate?: number }) => {
  if (Speech) {
    // Use expo-speech for mobile
    Speech.speak(text, {
      language: options?.language || 'en',
      pitch: options?.pitch || 1.0,
      rate: options?.rate || 0.9,
    });
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Use Web Speech API for web
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.language || 'en-US';
    utterance.pitch = options?.pitch || 1.0;
    utterance.rate = options?.rate || 0.9;
    window.speechSynthesis.speak(utterance);
  } else {
    // Fallback - just log for now
    console.log('Speaking:', text);
  }
};

export const stop = () => {
  if (Speech) {
    Speech.stop();
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

