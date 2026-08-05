"use client";
import { useEffect, useState } from 'react';
import { Tldraw, Editor, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';

export default function Whiteboard() {
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const handleToolCall = (event: Event) => {
      if (!editor) return;

      const customEvent = event as CustomEvent;
      const toolCalls = customEvent.detail;

      toolCalls.forEach((tc: Record<string, unknown>) => {
        const functionData = tc.function as Record<string, unknown>;
        if (!functionData || !functionData.arguments) return;

        try {
          const args = JSON.parse(functionData.arguments as string);
          const name = functionData.name as string;

          if (name === 'clear_whiteboard') {
            editor.selectAll();
            editor.deleteShapes(editor.getSelectedShapeIds());
          }

          else if (name === 'render_text_block') {
            const id = createShapeId();
            editor.createShape({
              id,
              type: 'text',
              x: args.x || 0,
              y: args.y || 0,
              props: {
                text: args.content as string,
                size: ((args.fontSize as number) > 24 ? 'l' : ((args.fontSize as number) < 16 ? 's' : 'm')) as "s" | "m" | "l",
              } as any,
            });
          }

          else if (name === 'draw_shape') {
            const id = createShapeId();
            editor.createShape({
              id,
              type: args.shapeType || 'geo',
              x: args.x || 0,
              y: args.y || 0,
              props: {
                w: args.width || 100,
                h: args.height || 100,
                text: args.label || '',
                geo: args.geoShape || 'rectangle',
              } as any,
            });
          }
        } catch (e) {
          // Incomplete JSON from streaming, ignore until next chunk completes it
        }
      });
    };

    window.addEventListener('ai-tool-call', handleToolCall);
    return () => window.removeEventListener('ai-tool-call', handleToolCall);
  }, [editor]);

  return (
    <div className="w-full h-full relative" style={{ isolation: 'isolate' }}>
      <Tldraw onMount={(editor) => setEditor(editor)} />
    </div>
  );
}
