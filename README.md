# AI Teacher

An AI tutor that teaches by writing on a whiteboard — handwritten-looking
text, equations, and simple diagrams that animate on screen the way a real
teacher would draw them, powered by the Groq API. You can ask follow-up
questions mid-lesson and it keeps writing, in context.

## How it works

- You type a topic. `/api/lesson` asks Groq (`openai/gpt-oss-120b` by
  default) for a short lesson, structured as a sequence of **blocks**
  (`heading`, `text`, `bullet`, `equation`, `diagram`, `emphasize`) instead of
  one big wall of text.
- The browser (`whiteboard.js`) animates each block onto an HTML canvas: text
  is "handwritten" character by character with a moving pen-tip and slight
  jitter, diagrams (circle / box / triangle / arrow / line) are stroked in
  progressively, and `emphasize` blocks circle or underline the important bit.
- When you ask a follow-up question, `/api/ask` sends the running
  conversation back to Groq along with `interactionId`, so the answer
  continues in context and gets written below the existing lesson.
- `interactionId` is the whole conversation history, base64-encoded — not a
  server-side session. This keeps the app correct on serverless hosting
  (Vercel functions don't share memory between requests/instances), at the
  cost of the id growing a bit with very long Q&A sessions.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Groq key (get one free at
   https://console.groq.com/keys):
   ```
   cp .env.example .env
   ```
3. Start the server locally:
   ```
   npm start
   ```
4. Open http://localhost:3000

## Deploying to Vercel

1. Push this project to GitHub — **make sure `.env` is in `.gitignore` and
   never gets committed** (it already is here).
2. Import the repository in Vercel.
3. In the Vercel project → **Settings → Environment Variables**, add
   `GROQ_API_KEY` with your key, for Production (and Preview if you want
   preview deploys to work too). This step is required — Vercel does **not**
   read your local `.env` file; it only exists on your machine.
4. Deploy (or redeploy, if you added the env var after the first deploy —
   changing env vars doesn't auto-redeploy).
5. No `vercel.json` is needed: `/api/lesson.js` and `/api/ask.js` are
   auto-detected as serverless functions, and the rest of the files
   (`index.html`, `style.css`, `app.js`, `whiteboard.js`) are served as
   static assets automatically.

## Project structure

```
ai-teacher/
  api/
    lesson.js          POST /api/lesson — starts a new lesson
    ask.js              POST /api/ask    — answers a follow-up question
  lib/
    groq.js            Shared Groq API client + block-JSON parsing
  server.js             Local Express server for development only
  index.html            Page markup: whiteboard frame + topic form + ask dock
  style.css              Classroom/whiteboard visual theme
  whiteboard.js          Canvas engine — animates handwriting, shapes, emphasis
  app.js                 Wires the forms to the backend and the whiteboard
  .env.example
```

## Tweaking it

- **Teaching style / block rules**: edit `TEACHER_SYSTEM_INSTRUCTION` in
  `lib/groq.js`.
- **Writing speed**: change the per-character delay in `_animateLine()` in
  `whiteboard.js` (currently ~14–30ms/char).
- **Colors / fonts**: `style.css` (`:root` variables) and the `INK_COLORS`
  / font constants at the top of `whiteboard.js`.
- **Model**: set `GROQ_MODEL` in your environment if you want to try a
  different model. It must support Groq's `response_format: json_object`
  mode. Avoid `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` — Groq has
  deprecated both (shutdown scheduled mid-August 2026).

## Troubleshooting "nothing happens when deployed"

- **Blank response / spinner forever**: open your browser's DevTools →
  Network tab, click "Start lesson", and check the `/api/lesson` request. A
  404 means the function isn't deployed (check the Vercel deployment's
  "Functions" tab); a 500 means it deployed but errored (check that
  deployment's Function Logs for the real error message).
- **500 error mentioning `GROQ_API_KEY`**: the env var isn't set for that
  environment in Vercel, or you added it after the last deploy and haven't
  redeployed since.
- **Works locally, not on Vercel**: almost always the env var — local `.env`
  files are never read by deployed Vercel functions.

## Notes

- The Groq API key is kept server-side (never sent to the browser) — the
  frontend only talks to your own `/api/lesson` and `/api/ask` endpoints.
- If a lesson fails to generate, check your terminal (locally) or the
  Vercel Function Logs (deployed) — the server logs the full Groq error
  there, and a short version shows on the page.
