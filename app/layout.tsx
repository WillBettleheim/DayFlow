
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DAYFLOW — Your Personal Life OS",
    template: "%s | DAYFLOW",
  },
  description:
    "DAYFLOW is your personal productivity workspace for managing tasks, planning your day, tracking projects, and staying focused.",
  applicationName: "DAYFLOW",
  keywords: [
    "DAYFLOW",
    "productivity",
    "task management",
    "daily planner",
    "focus timer",
    "project management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#191b19] text-[#f5f5f0] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
