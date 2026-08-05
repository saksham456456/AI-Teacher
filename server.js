import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import lessonHandler from './api/lesson.js';
import askHandler from './api/ask.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/lesson', lessonHandler);
app.post('/api/ask', askHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn(
      '⚠ GROQ_API_KEY is not set. Copy .env.example to .env and add your key, then restart.'
    );
  }
  console.log(`AI Teacher running at http://localhost:${PORT}`);
});
