'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavProps {
  className?: string;
}

export function Nav({ className = '' }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`
        fixed inset-x-0 top-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}
        ${className}
      `}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-margin-mobile">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Lefta</span>
        </Link>

        {/* Center links */}
        <div className="hidden gap-8 md:flex">
          <a href="#cara-kerja" className="text-label-lg text-on-surface hover:text-primary transition-colors">
            Cara Kerja
          </a>
          <a href="#keamanan" className="text-label-lg text-on-surface hover:text-primary transition-colors">
            Keamanan
          </a>
          <a href="#bukti" className="text-label-lg text-on-surface hover:text-primary transition-colors">
            Bukti
          </a>
        </div>

        {/* CTA */}
        <Link
          href="/send"
          className="rounded-md bg-primary px-4 py-2 text-label-lg text-white hover:bg-primary/90 transition-colors"
        >
          Buka App
        </Link>
      </div>
    </nav>
  );
}
