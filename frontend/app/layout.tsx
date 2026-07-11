import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lefta — Kirim Uang dengan Pembagian Cerdas",
  description: "Alat kerja untuk TKI kirim uang dan keluarga cek penerimaan dengan pembagian otomatis via Stellar",
  keywords: ["remitansi", "Stellar", "USDC", "pembagian otomatis", "TKI"],
  authors: [{ name: "Lefta" }],
  openGraph: {
    title: "Lefta — Kirim Uang dengan Pembagian Cerdas",
    description: "Alat kerja untuk TKI kirim uang dan keluarga cek penerimaan dengan pembagian otomatis via Stellar",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5b6400",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
