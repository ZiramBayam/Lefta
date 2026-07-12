"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconHistory } from "@/components/ui";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/app",
    label: "Home",
    icon: <IconHome size={24} />,
  },
  {
    href: "/send/history",
    label: "History",
    icon: <IconHistory size={24} />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Check if current path is active (simplified matching)
  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app" || pathname.startsWith("/send") || pathname.startsWith("/receive");
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 w-full z-50
        flex justify-around items-center
        px-4 py-2
        max-w-[480px] mx-auto
        bg-surface-container-low
        shadow-[0px_-4px_20px_rgba(91,100,0,0.06)]
        rounded-t-xl
        pb-6 pt-2
      "
      aria-label="Navigation"
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center
              px-6 py-2
              rounded-xl
              min-h-[56px]
              transition-all duration-200
              ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }
            `}
            aria-current={active ? "page" : undefined}
          >
            <span className="mb-1">{item.icon}</span>
            <span className="text-label-md font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
