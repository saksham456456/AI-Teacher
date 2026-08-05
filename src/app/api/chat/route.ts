import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are AI Teacher, an empathetic, highly effective, and gamified personal tutor.

Guidelines:
1. Socratic Teaching: Keep chat responses concise and conversational. Explain concepts simply, then ask a guiding question to check understanding.
2. Gamemaster Mode: Award XP explicitly in responses when the user answers correctly or asks a deep question by including [XP:+25] (or appropriate amount) in your response text.
3. Whiteboard Mastery: When explaining complex math formulas, algorithms, system architectures, or step-by-step processes, DO NOT clutter the chat window. Instead, call the appropriate whiteboard functions to draw the explanation directly on the user's canvas while providing brief verbal guidance in the chat.
4. Quizzes: If asked to test knowledge, provide a multiple choice quiz inline. When they answer correctly, provide [XP:+50].
`;

const tools = [
  {
    type: "function",
    function: {
      name: "render_text_block",
      description: "Writes formatted text or LaTeX math on the canvas at specific coordinates.",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X coordinate on the canvas" },
          y: { type: "number", description: "Y coordinate on the canvas" },
          content: { type: "string", description: "The text or math to render" },
          fontSize: { type: "number", description: "Font size in pixels", default: 24 }
        },
        required: ["x", "y", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draw_shape",
      description: "Draws visual blocks (rectangles, circles, arrows) to structure concepts spatially.",
      parameters: {
        type: "object",
        properties: {
          shapeType: { type: "string", enum: ["geo", "arrow", "note", "draw"], description: "The type of tldraw shape to create" },
          x: { type: "number", description: "X coordinate" },
          y: { type: "number", description: "Y coordinate" },
          width: { type: "number", description: "Width of the shape (if applicable)" },
          height: { type: "number", description: "Height of the shape (if applicable)" },
          label: { type: "string", description: "Text label inside the shape" },
          geoShape: { type: "string", enum: ["rectangle", "ellipse", "triangle"], description: "If shapeType is 'geo', specifies the specific geometry" }
        },
        required: ["shapeType", "x", "y"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "clear_whiteboard",
      description: "Clears or archives current canvas content for a new topic.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
    }

    const requestBody = {
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      tools: tools,
      tool_choice: "auto",
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      return NextResponse.json({ error: "Failed to fetch response from Groq" }, { status: response.status });
    }

    const stream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line === 'data: [DONE]') {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            continue;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              const delta = data.choices[0]?.delta;

              if (delta) {
                const clientData: Record<string, unknown> = {};
                if (delta.content) {
                  clientData.content = delta.content;
                }
                if (delta.tool_calls) {
                  clientData.tool_calls = delta.tool_calls;
                }

                if (Object.keys(clientData).length > 0) {
                   controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(clientData)}\n\n`));
                }
              }
            } catch (e) {
              // Ignore parse errors from incomplete chunks
            }
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(stream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
