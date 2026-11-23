import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { MotionPreferences } from "@/components/layout/motion-preferences";
import "./globals.css";
import "./journal.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scale-Bae | Track Your Weight Journey",
  description: "A fun, feminine weight tracking app that reads your scale photos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}><MotionPreferences>{children}</MotionPreferences></body>
    </html>
  );
}
