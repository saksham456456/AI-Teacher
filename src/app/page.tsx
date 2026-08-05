"use client";
import DynamicWorkspace from '@/components/DynamicWorkspace';
import ChatInterface from '@/components/ChatInterface';
import Whiteboard from '@/components/Whiteboard';

export default function Home() {
  return (
    <div className="h-full w-full">
      <DynamicWorkspace
        chatComponent={<ChatInterface />}
        whiteboardComponent={<Whiteboard />}
      />
    </div>
  );
}
