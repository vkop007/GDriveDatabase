import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GDrive DB - NoSQL Database on Google Drive",
  description: "A modern NoSQL database built on Google Drive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "rgb(23, 23, 23)",
              border: "1px solid rgb(64, 64, 64)",
              color: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            },
            classNames: {
              success: "!border-green-500/30 !bg-green-500/10",
              error: "!border-red-500/30 !bg-red-500/10",
              warning: "!border-yellow-500/30 !bg-yellow-500/10",
              info: "!border-blue-500/30 !bg-blue-500/10",
            },
          }}
        />
      </body>
    </html>
  );
}
