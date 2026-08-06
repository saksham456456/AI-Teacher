export function decodeHistory(interactionId) {
  if (!interactionId) return [];
  try {
    // Safely decode the base64 history string back into an array of messages
    return JSON.parse(Buffer.from(interactionId, 'base64').toString('utf-8'));
  } catch (e) {
    console.error('Failed to decode history:', e);
    return [];
  }
}

export function encodeHistory(messages) {
  // Encode the conversation array into a base64 string to keep it stateless
  return Buffer.from(JSON.stringify(messages)).toString('base64');
}

export async function askGroq(messages) {
  // Read environment variables INSIDE the function to avoid dotenv loading races
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const API_KEY = (process.env.GROQ_API_KEY || '').trim();

  if (!API_KEY) {
    throw new Error('GROQ_API_KEY is missing from environment variables. Check your .env file.');
  }

  const TEACHER_SYSTEM_INSTRUCTION = `You are an AI teacher writing on a whiteboard.
Respond ONLY with a JSON object containing a "blocks" array.
Each block must have a "type" and a "text" string, EXCEPT for "diagram" blocks which use a "shape" string and an optional "text" string, and "emphasize" blocks which use a "shape" string.
Allowed types: "heading", "text", "bullet", "equation", "diagram", "emphasize".
- "heading": A main topic title.
- "text": Standard paragraph text.
- "bullet": A bullet point.
- "equation": A math or science equation.
- "diagram": One of: "circle", "box", "triangle", "arrow", "line" (Put the shape name in the "shape" field, and any caption in "text").
- "emphasize": One of: "box", "circle", "underline" (Put the shape name in the "shape" field).
Keep lessons short, engaging, and easy to read.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: TEACHER_SYSTEM_INSTRUCTION },
        ...messages
      ],
      response_format: { type: 'json_object' }
    })
  });


  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error?.message || `Groq API Error: ${response.status}`;

    // Pragmatic Workaround: If the key is invalid, return a mock lesson to unblock the user
    if (errorMessage.toLowerCase().includes('invalid api key') || response.status === 401) {
      console.warn("API Key invalid, using fallback mock response to keep app running.");
      return {
        blocks: [
          { type: 'heading', text: 'Welcome to the Mock Lesson!' },
          { type: 'text', text: 'It looks like your API key was invalid. But don\'t worry, we are using a mock response so you can test out the gamification features!' },
          { type: 'bullet', text: 'You gained XP for this bullet point.' },
          { type: 'equation', text: 'E = mc^2 + XP' },
          { type: 'diagram', shape: 'box', text: 'A box of XP' },
          { type: 'emphasize', shape: 'circle' }
        ]
      };
    }

    throw new Error(errorMessage);
  }


  const data = await response.json();

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    throw new Error('The AI did not return a valid JSON object.');
  }
}
