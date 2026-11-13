
const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();

app.use(express.json({ limit: '1mb' }));

const port = process.env.PORT || 3000;

// GEMINI CONFIGURATION
const API_KEY = process.env.GEMINI_API;

const MODEL_NAME =
  process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

const API_URL = API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`
  : null;

// REQUEST TIMEOUT
const REQUEST_TIMEOUT = 30000;

// ROOT
app.get('/', (req, res) => {
  res.send(' Server AI Tutor KIDEA berjalan');
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KIDEA AI Tutor',
    model: MODEL_NAME,
    geminiConfigured: Boolean(API_KEY)
  });
});

// CHAT API
app.post('/chat', async (req, res) => {
  const startTime = Date.now();

  try {
    const userMessage = req.body?.message;

    // VALIDASI PESAN
    if (
      typeof userMessage !== 'string' ||
      !userMessage.trim()
    ) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // VALIDASI API KEY
    if (!API_KEY) {
      console.error('Gemini API key is not configured');

      return res.status(500).json({
        error: 'Gemini API is not configured'
      });
    }

    // REQUEST KE GEMINI
    const response = await fetch(
      `${API_URL}?key=${encodeURIComponent(API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage.trim()
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.7
          }
        }),
        timeout: REQUEST_TIMEOUT
      }
    );

    // MEMBACA RESPONS GEMINI
    const data = await response.json();

    // PEMERIKSAAN STATUS API
    if (!response.ok) {
      console.error(
        `Gemini API error: HTTP ${response.status}`,
        data.error?.status || 'Unknown error'
      );

      return res.status(502).json({
        error: 'Gemini API request failed',
        status: response.status
      });
    }

    // MENGAMBIL JAWABAN AI
    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim() || 'Tidak ada respons';

    // MENCATAT DURASI RESPONS
    const duration = Date.now() - startTime;

    console.log(
      `[KIDEA AI] Model: ${MODEL_NAME} | Duration: ${duration}ms`
    );

    // RESPONS KE FLUTTER
    return res.json({
      reply: reply
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(
      `[KIDEA AI] Request failed after ${duration}ms:`,
      error.name
    );

    if (error.name === 'AbortError' || error.type === 'request-timeout') {
      return res.status(504).json({
        error: 'Gemini API request timeout'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// LOCAL SERVER
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🤖 Gemini model: ${MODEL_NAME}`);
  });
}

// EXPORT FOR VERCEL
module.exports = app;
