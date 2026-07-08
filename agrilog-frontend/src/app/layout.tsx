/* eslint-disable react-hooks/set-state-in-effect */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../css/globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "AgriLog | Nền tảng Nhật ký Canh tác",
  description: "Giải pháp số hóa quản lý nông trại và nhật ký canh tác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
