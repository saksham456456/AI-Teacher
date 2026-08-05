import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GamifiedHeader from "@/components/GamifiedHeader";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Teacher - Gamified Learning",
  description: "Learn anything with your personal AI teacher and interactive whiteboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <GamifiedHeader />
        <main className="pt-16 h-screen w-screen overflow-hidden relative">
          {children}
        </main>
        <ToastProvider />
      </body>
    </html>
  );
}
