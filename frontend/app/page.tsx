"use client";

import Link from "next/link";
import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";
import { IconSend, IconReceipt } from "@/components/ui";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopAppBar />

      {/* Main Content */}
      <main
        className="
          flex-1 flex flex-col justify-center
          px-container-padding pb-32 pt-8
          gap-stack-gap-lg
        "
      >
        {/* Send Button */}
        <Link
          href="/send"
          className="
            w-full h-[180px]
            bg-primary-container text-on-primary-container
            rounded-xl flex flex-col items-center justify-center gap-4
            hover:bg-surface-container-high
            active:scale-[0.98]
            transition-all duration-200
            shadow-[0px_4px_20px_rgba(91,100,0,0.06)]
            group relative overflow-hidden
          "
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <IconSend size={48} className="group-hover:-translate-y-1 transition-transform duration-300" />
          <span className="text-headline-md font-bold">Kirim</span>
        </Link>

        {/* Check Receipts Button */}
        <Link
          href="/receive"
          className="
            w-full h-[180px]
            bg-surface-container text-on-surface
            rounded-xl flex flex-col items-center justify-center gap-4
            hover:bg-surface-container-high
            active:scale-[0.98]
            transition-all duration-200
            shadow-[0px_4px_20px_rgba(91,100,0,0.06)]
            group relative overflow-hidden
          "
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <IconReceipt
            size={48}
            className="text-secondary group-hover:-translate-y-1 transition-transform duration-300"
          />
          <span className="text-headline-md font-bold">Cek Penerimaan</span>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
