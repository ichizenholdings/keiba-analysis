import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Keiba Analysis - 競馬分析",
  description: "JRDB データ解析・レース分析アプリケーション by Ichizen Holdings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
          <a href="/" className="font-bold text-lg">🏇 Keiba Analysis</a>
          <a href="/races" className="hover:text-blue-300 text-sm">レース一覧</a>
          <a href="/horses" className="hover:text-blue-300 text-sm">馬データ</a>
          <a href="/track-bias" className="hover:text-blue-300 text-sm">馬場バイアス</a>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
