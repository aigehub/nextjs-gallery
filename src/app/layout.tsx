import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gallery相册",
  description: "名媛，网红，美女，模特，大蜜，蜜桃臀，空姐，COSER，极品，御姐，萝莉。高颜值，白小纯，CP，极品烧杯，人间尤物，翘臀大胸，丰乳肥臀。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
       <GoogleAnalytics gaId="G-B0483METSX" />
    </html>
  );
}
