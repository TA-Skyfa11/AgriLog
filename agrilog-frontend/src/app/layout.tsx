/* eslint-disable react-hooks/set-state-in-effect */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AppProvider } from '@/context/AppProvider';
import { DialogProvider } from '@/context/DialogContext';
import OneSignalInit from '@/components/common/OneSignalInit';
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
      <head>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
          onError={() => {
            console.warn('[OneSignal] Script bị chặn bởi trình duyệt (ERR_BLOCKED_BY_CLIENT). Nguyên nhân thường do tiện ích AdBlock/Brave Shields.');
            if (typeof window !== 'undefined') {
              (window as any).__onesignal_blocked = true;
            }
          }}
        />
      </head>
      <body className={inter.className}>
        <OneSignalInit />
        <AppProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
        </AppProvider>
      </body>
    </html>
  );
}

