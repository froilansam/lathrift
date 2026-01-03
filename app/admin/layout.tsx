"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton, RedirectToSignIn } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Store,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-background">
          {/* Header - Similar to storefront */}
          <header
            className={cn(
              "sticky top-0 z-50 w-full transition-all duration-300 border-b",
              scrolled
                ? "bg-background/95 backdrop-blur-md border-border shadow-sm"
                : "bg-background border-border"
            )}
          >
            <div className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 max-w-7xl">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Logo */}
              <Link href="/admin" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="LA Thrift"
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
                <span className="hidden sm:inline-flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-accent uppercase px-2 py-1 bg-accent/10 rounded">
                    Admin
                  </span>
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  target="_blank"
                  className="hidden sm:flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <Store className="h-4 w-4" />
                  View Store
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            </div>
          </header>

          {/* Admin Marquee Banner */}
          <div className="bg-accent text-accent-foreground py-2 overflow-hidden">
            <div className="flex items-center justify-center gap-8 text-xs font-bold tracking-wider">
              <span>★</span>
              <span>ADMIN PANEL</span>
              <span>★</span>
              <span>LA THRIFT</span>
              <span>★</span>
              <span>EST. 2020</span>
              <span>★</span>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 transform bg-background border-r border-border transition-transform lg:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-full flex-col">
              {/* Mobile Sidebar Header */}
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <Link href="/admin" className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="LA Thrift"
                    width={100}
                    height={35}
                    className="h-7 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* View Store Link */}
              <div className="border-t border-border p-4">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <Store className="h-5 w-5" />
                  View Store
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
