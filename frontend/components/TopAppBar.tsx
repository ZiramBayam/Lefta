"use client";

import Link from "next/link";
import WalletButton from "./WalletButton";
import { IconWallet, IconArrowBack } from "@/components/ui";

interface TopAppBarProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function TopAppBar({
  title = "Lefta",
  showBackButton = false,
  onBack,
}: TopAppBarProps) {
  return (
    <header
      className="
        sticky top-0 z-40 w-full
        bg-surface
        shadow-[0px_4px_20px_rgba(91,100,0,0.02)]
      "
    >
      <div
        className="
          flex justify-between items-center
          px-container-padding py-4
          max-w-[480px] mx-auto w-full
        "
      >
        <div className="flex items-center gap-2">
          {showBackButton ? (
              <Link
                href="/app"
                className="
                w-12 h-12
                flex items-center justify-center
                rounded-full
                text-primary
                hover:bg-primary-container/20
                transition-colors
              "
              aria-label="Kembali"
              onClick={onBack}
            >
              <IconArrowBack size={24} />
            </Link>
          ) : (
            <>
              <IconWallet size={28} className="text-primary" />
              <h1 className="text-display-lg-mobile text-primary font-bold tracking-tight">
                {title}
              </h1>
            </>
          )}
        </div>

        <div className="flex items-center">
          {showBackButton && (
            <span className="text-headline-md text-on-surface font-semibold text-center flex-1 pr-12">
              {title}
            </span>
          )}
          {!showBackButton && <WalletButton />}
        </div>
      </div>
    </header>
  );
}
