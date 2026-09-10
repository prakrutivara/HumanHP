import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUMANHP",
  description:
    "A personal wellness status system — log how you feel, your habits, and your progress in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}