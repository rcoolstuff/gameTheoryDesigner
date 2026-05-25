import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Theory Designer",
  description: "Frame negotiations as game-theory models with clean payoff visuals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
