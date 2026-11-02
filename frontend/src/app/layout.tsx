import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "PhishGuard AI - Protect Your Banking Identity from Phishing Threats",
  description: "AI-Powered Real-Time Detection of Fraudulent E-Banking Websites using Associative Classification. Scan URLs, detect phishing, and protect your online banking.",
  keywords: "phishing detection, e-banking security, AI security, URL scanner, cyber security, phishing protection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a0a1a" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
