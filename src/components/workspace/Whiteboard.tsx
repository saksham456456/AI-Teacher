'use client';

import { Tldraw, useEditor, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import { useEffect } from 'react';

// We need a hook to interact with the tldraw editor instance from outside
export const useWhiteboardEvents = () => {
  // This will be implemented by subscribing to a custom event
};

function WhiteboardInner() {
  const editor = useEditor();

  useEffect(() => {
    if (!editor) return;

    const handleWhiteboardCommand = (e: CustomEvent) => {
      const { toolName, args } = e.detail;

      try {
        if (toolName === 'clear_whiteboard') {
          // Keep the background, just clear shapes
          const allShapes = Array.from(editor.getCurrentPageShapeIds().values());
          editor.deleteShapes(allShapes);
        }
        else if (toolName === 'render_text_block') {
          const { x, y, content, fontSize } = args;
          const id = createShapeId();
          editor.createShape({
            id,
            type: 'text',
            x,
            y,
            props: {
              text: content,
              size: fontSize && fontSize > 20 ? 'l' : 'm',
              color: 'black',
            } as Record<string, unknown>,
          });
        }
        else if (toolName === 'draw_shape') {
          const { shapeType, x, y, w = 150, h = 100, endX, endY, label, color = 'blue' } = args;
          const id = createShapeId();

          if (shapeType === 'arrow' || shapeType === 'line') {
             editor.createShape({
                id,
                type: shapeType,
                x,
                y,
                props: {
                  start: { x: 0, y: 0 },
                  end: { x: (endX || x + 100) - x, y: (endY || y + 100) - y },
                  color,
                  text: label || '',
                } as Record<string, unknown>
             });
          } else {
             editor.createShape({
              id,
              type: 'geo',
              x,
              y,
              props: {
                geo: shapeType,
                w,
                h,
                text: label || '',
                color,
                fill: 'semi',
              } as Record<string, unknown>,
            });
          }
        }
      } catch (err) {
        console.error("Failed to execute whiteboard tool:", err);
      }
    };

    window.addEventListener('whiteboard-command', handleWhiteboardCommand as EventListener);
    return () => window.removeEventListener('whiteboard-command', handleWhiteboardCommand as EventListener);
  }, [editor]);

  return null;
}

export default function Whiteboard() {
  return (
    <div className="w-full h-full relative" style={{ zIndex: 0 }}>
      <style dangerouslySetInnerHTML={{__html: `
        .tl-theme__dark {
          --color-background: #020617; /* slate-950 */
          --color-grid: rgba(255, 255, 255, 0.05);
        }
      `}} />
      <Tldraw>
        <WhiteboardInner />
      </Tldraw>
    </div>
  );
}
