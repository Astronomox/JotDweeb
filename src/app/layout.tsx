import type { Metadata } from "next";
// Fonts are self-hosted from npm so the dev server never waits on Google Fonts.
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clay Journal",
  description: "A quiet space to think out loud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper font-body text-ink">{children}</body>
    </html>
  );
}
