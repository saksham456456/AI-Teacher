import { askGroq, encodeHistory } from '../lib/groq.js';

export default async function handler(req, res) {
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    // Start a fresh conversation
    const messages = [{ role: 'user', content: `Teach me about: ${topic}` }];

    // Fetch JSON from Groq
    const responseJson = await askGroq(messages);

    // Save the AI's exact response into the history array
    messages.push({ role: 'assistant', content: JSON.stringify(responseJson) });

    // Encode the history to send back to the client
    const interactionId = encodeHistory(messages);

    // Send the blocks array and the stateless memory ID back to app.js
    res.status(200).json({
      blocks: responseJson.blocks || [],
      interactionId
    });
  } catch (error) {
    console.error('Lesson Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate lesson' });
  }
}
