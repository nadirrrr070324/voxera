import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "VOXERA — Voice is the new interface.",
  description:
    "A real-time voice & audio AI platform powered by Gemini. Listen, interrupt, translate, and turn conversation into action — instantly.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="bg-[var(--md-sys-color-surface)] font-sans text-[var(--md-sys-color-on-surface)] antialiased">
        {children}
      </body>
    </html>
  );
}
