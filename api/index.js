const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

// ROOT
app.get('/', (req, res) => {
  res.send('🚀 Server AI Tutor KIDEA berjalan');
});

// CHAT API
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const MODEL_NAME = 'gemini-2.0-flash-lite';

    const API_URL =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: userMessage
              }
            ]
          }
        ]
      }),
    });

    const data = await response.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Tidak ada respons';

    res.json({ reply });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// LOCAL SERVER
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// EXPORT FOR VERCEL
module.exports = app;