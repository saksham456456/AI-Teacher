import { askGroq, decodeHistory, encodeHistory } from '../lib/groq.js';

export default async function handler(req, res) {
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, interactionId } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // Decode the previous conversation from the frontend
    const messages = decodeHistory(interactionId);

    // Append the user's follow-up question
    messages.push({ role: 'user', content: question });

    // Fetch the contextual response from Groq
    const responseJson = await askGroq(messages);

    // Save the AI's response into the history array
    messages.push({ role: 'assistant', content: JSON.stringify(responseJson) });

    // Re-encode the newly updated history
    const newInteractionId = encodeHistory(messages);

    // Send the new blocks and updated memory ID back to app.js
    res.status(200).json({
      blocks: responseJson.blocks || [],
      interactionId: newInteractionId
    });
  } catch (error) {
    console.error('Ask Error:', error);
    res.status(500).json({ error: error.message || 'Failed to answer question' });
  }
}
