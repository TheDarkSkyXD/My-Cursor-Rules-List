"use client";

import { Link } from "@/i18n/routing";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

/**
 * AppHeader Component
 *
 * A responsive navigation header component that includes:
 * - Logo and brand name
 * - Navigation links (desktop)
 * - Mobile menu toggle
 * - Theme toggle
 * - Authentication-based actions (Sign in/User button)
 */

export function AppHeader() {
  const t = useTranslations("nav");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-opacity-20 bg-opacity-70 supports-[backdrop-filter]:bg-opacity-70 border-b border-[--border] bg-[--background] supports-[backdrop-filter]:backdrop-blur">
      <div className="container mx-auto px-3 md:px-4">
        <div className="relative flex h-14 items-center justify-between md:h-16">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link href="/" className="flex items-center gap-1.5 text-lg font-bold md:gap-2 md:text-xl">
              <span className="text-primary whitespace-nowrap drop-shadow-lg">{t("app.name")}</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
            <Link href="/" className="hover:text-muted-foreground text-xs font-medium md:text-sm">
              {t("home")}
            </Link>
            <Link href="/about" className="hover:text-muted-foreground text-xs font-medium md:text-sm">
              {t("about")}
            </Link>
            <Link href="/contact" className="hover:text-muted-foreground text-xs font-medium md:text-sm">
              {t("contact")}
            </Link>
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="bg-background md:hidden">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="hover:text-muted-foreground font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("home")}
              </Link>
              <Link
                href="/about"
                className="hover:text-muted-foreground font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("about")}
              </Link>
              <Link
                href="/contact"
                className="hover:text-muted-foreground pb-4 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("contact")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
