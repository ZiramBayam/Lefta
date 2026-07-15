import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { WalletProvider } from "@/context/WalletContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Lefta - Warm Web3 Remittance",
  description: "Warm Web3 Remittance application for sending funds and checking receipts easily.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        <WalletProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
