"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

export function Header() {
  const { totalItems, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled
        ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
        : "bg-transparent"
    )}>
      <div className={cn(
        "mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300",
        scrolled ? "h-16 max-w-7xl" : "h-20 max-w-7xl"
      )}>
        {/* Logo - Big when on top, smaller on scroll */}
        <Link href="/" className="flex items-center group">
          <motion.div
            whileHover={{ scale: 1.03, rotate: -1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="relative"
          >
            <Image
              src="/logo.png"
              alt="LA Thrift"
              width={200}
              height={70}
              className={cn(
                "object-contain transition-all duration-300",
                scrolled ? "h-10 w-auto" : "h-16 sm:h-20 w-auto"
              )}
              priority
            />
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/shop">Shop</NavLink>
        </nav>

        {/* Cart & Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Cart Button */}
          <motion.button
            onClick={() => setIsOpen(true)}
            className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground font-bold"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border md:hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              <MobileNavLink
                href="/"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </MobileNavLink>
              <MobileNavLink
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </MobileNavLink>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium text-muted transition-colors hover:text-foreground",
        "relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
