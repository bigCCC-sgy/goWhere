import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "此刻去哪",
  description: "把心情、预算和天气交给我，今晚就有一条刚刚好的路线。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
