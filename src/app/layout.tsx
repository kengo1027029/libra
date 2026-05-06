import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libra 管理 | ドッグマルシェ情報ポータル",
  description: "Libra 管理者向けコンソール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} min-h-dvh font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
