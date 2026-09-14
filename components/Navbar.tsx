"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/search", label: "Cari & Filter", icon: "🔍" },
  { href: "/advance", label: "Advance", icon: "👑" },
  { href: "/bookmark", label: "Bookmark", icon: "🔖" },
  { href: "/history", label: "History", icon: "🕓" },
  { href: "/account", label: "Akun", icon: "👤" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top Navbar */}
      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <span className="logo-icon">⚡</span>
            <span>KomikZone</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="navbar-links">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`navbar-link ${pathname === l.href ? "navbar-link-active" : ""}`}
              >
                <span className="nav-icon">{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>

          {/* Search shortcut */}
          <Link href="/search" className="btn-search-icon" aria-label="Search">
            🔍
          </Link>
        </div>
      </header>

      {/* Bottom Mobile Nav */}
      <nav className="bottom-nav">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`bottom-nav-item ${pathname === l.href ? "bottom-nav-active" : ""}`}
          >
            <span className="bottom-nav-icon">{l.icon}</span>
            <span className="bottom-nav-label">{l.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
