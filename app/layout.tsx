import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "$TRUCE | Straighten the line",
  description: "A community meme token on Solana for everyone who wants the war to end.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
