import type { Metadata } from "next";
import { Oswald, Manrope, Geist } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", display.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sans)]">
        <JsonLd />
        {children}
        <FloatingWhatsAppButton />
      </body>
    </html>
  );
}
