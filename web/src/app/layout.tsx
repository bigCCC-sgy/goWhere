import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "此刻去哪",
  title: "此刻去哪",
  description: "把心情、预算和天气交给我，生成一条刚刚好的路线。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/gowhere-icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/favicon-32.png"],
  },
  appleWebApp: {
    capable: true,
    title: "此刻去哪",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
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
