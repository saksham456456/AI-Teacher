import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('llama-3.3-70b-versatile'),
    system: `You are AI Teacher, an empathetic, highly effective, and gamified personal tutor.

Guidelines:
1. Socratic Teaching: Keep chat responses concise, conversational, and encouraging. Explain concepts simply, then ask a guiding question to check understanding.
2. Gamemaster Mode: Award XP explicitly in responses when the user answers correctly or asks a deep question by including [XP:+25] in your response text.
3. Whiteboard Mastery: When explaining complex math formulas, algorithms, system architectures, or step-by-step processes, DO NOT clutter the chat window. Instead, call the appropriate whiteboard functions to draw the explanation directly on the user's canvas while providing brief verbal guidance in the chat.`,
    messages,
    tools: {
      render_text_block: tool({
        description: 'Writes formatted text or LaTeX math on the canvas at specific coordinates.',
        parameters: z.object({
          x: z.number().describe('The x coordinate on the canvas.'),
          y: z.number().describe('The y coordinate on the canvas.'),
          content: z.string().describe('The text or LaTeX math to render.'),
          fontSize: z.number().optional().describe('The font size.'),
        }),
      }),
      draw_shape: tool({
        description: 'Draws visual blocks (rectangles, circles, arrows, stars) to structure concepts spatially. Note an arrow requires startX, startY, endX, endY.',
        parameters: z.object({
          shapeType: z.enum(['rectangle', 'ellipse', 'arrow', 'star', 'line']).describe('The type of shape to draw.'),
          x: z.number().describe('The starting x coordinate.'),
          y: z.number().describe('The starting y coordinate.'),
          w: z.number().optional().describe('Width of the shape.'),
          h: z.number().optional().describe('Height of the shape.'),
          endX: z.number().optional().describe('Ending x coordinate (for arrows/lines).'),
          endY: z.number().optional().describe('Ending y coordinate (for arrows/lines).'),
          label: z.string().optional().describe('Optional text label inside or near the shape.'),
          color: z.enum(['black', 'blue', 'green', 'yellow', 'light-red', 'red', 'violet']).optional().describe('Color of the shape.')
        }),
      }),
      clear_whiteboard: tool({
        description: 'Clears or archives the current canvas content for a new topic.',
        parameters: z.object({}),
      }),
      generate_quiz: tool({
        description: 'Generates an interactive multiple choice quiz to test the users knowledge.',
        parameters: z.object({
          question: z.string().describe('The quiz question.'),
          options: z.array(z.string()).describe('An array of string options (usually 3 or 4) for the user to choose from.'),
          correctOptionIndex: z.number().describe('The zero-based index of the correct option in the options array.'),
        }),
      }),
    },
  });

  return result.toAIStreamResponse(); // Note: Changed to toAIStreamResponse based on older AI SDK
}
