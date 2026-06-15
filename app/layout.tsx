import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Operations Center",
  description: "AI-Powered Auto-Remediation with Human Guardrails",
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
