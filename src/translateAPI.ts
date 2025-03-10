import axios from 'axios';

const TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100, // Maximum requests per window
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  requests: 0,
  windowStart: Date.now()
};

export async function translateText(text: string, targetLang: string) {
  try {
    // Check if we need to reset the window
    if (Date.now() - RATE_LIMIT.windowStart >= RATE_LIMIT.windowMs) {
      RATE_LIMIT.requests = 0;
      RATE_LIMIT.windowStart = Date.now();
    }

    // Check if we've hit the rate limit
    if (RATE_LIMIT.requests >= RATE_LIMIT.maxRequests) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Debug: Check if API key is loaded
    if (!TRANSLATE_API_KEY) {
      throw new Error('API key is not configured. Please check your .env file.');
    }

    // Increment request counter
    RATE_LIMIT.requests++;

    const response = await axios.post(
      `${TRANSLATE_API_URL}?key=${TRANSLATE_API_KEY}`,
      {
        q: text,
        target: targetLang,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Referer': window.location.origin
        }
      }
    );

    if (!response.data?.data?.translations?.[0]?.translatedText) {
      throw new Error('Invalid response from translation API');
    }

    return response.data.data.translations[0].translatedText;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('Rate limit exceeded. Please contact the owner if app usage is urgent.');
      }
      // If it's an axios error, it might have more details
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error Details:', error.response.data);
        throw new Error(`Translation failed: ${error.response.data?.error?.message || error.message}`);
      }
      throw error;
    }
    throw new Error('Failed to translate text');
  }
}