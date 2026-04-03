import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitMint",
  description: "A polished expense-sharing workspace with AI-assisted group settlement.",
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
