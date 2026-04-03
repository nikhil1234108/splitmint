import type { Metadata } from "next";
import "./globals.css";

const metadataBase = process.env.NEXT_PUBLIC_APP_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_APP_URL);
      } catch {
        return undefined;
      }
    })()
  : undefined;

export const metadata: Metadata = {
  title: "SplitMint",
  description: "A polished expense-sharing workspace with AI-assisted group settlement.",
  metadataBase,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-shell antialiased">{children}</body>
    </html>
  );
}
