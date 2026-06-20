import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@repo/ui";
import { PwaRegister } from "@/components/pwa-register/pwa-register";
import { InstallPrompt } from "@/components/install-prompt/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator/offline-indicator";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Leavicy Portal";

export const metadata: Metadata = {
  title: `${APP_NAME} — Sick Leave`,
  description:
    "Employee self-service for sick leave: request, track and view your team.",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e9488",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-center" />
        <PwaRegister id="pwa-register" />
        <InstallPrompt id="install-prompt" />
        <OfflineIndicator id="offline-indicator" />
      </body>
    </html>
  );
}
