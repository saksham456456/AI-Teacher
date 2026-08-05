import type { Metadata } from "next";
import "./globals.css";
import GamificationHeader from "@/components/GamificationHeader";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "AI Teacher",
  description: "A gamified AI learning platform with a dynamic whiteboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col h-screen overflow-hidden antialiased">
        <GamificationHeader />
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
        <ToastProvider />
      </body>
    </html>
  );
}
