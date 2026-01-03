import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Image
              src="/logo.png"
              alt="LA Thrift"
              width={160}
              height={56}
              className="h-14 w-auto object-contain brightness-0 invert"
            />
            <p className="mt-4 text-sm text-primary-foreground/70 max-w-sm">
              Thrifting made easy for you! Premium thrift finds with rare gems, branded items, at affordable prices. EST. 2020
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-accent" />
              <span className="text-xs font-medium tracking-widest text-accent uppercase">
                EST. 2020
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-4 text-accent">Shop</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <Link href="/shop" className="hover:text-accent transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/shop?featured=true" className="hover:text-accent transition-colors">
                  Featured Items
                </Link>
              </li>
              <li>
                <Link href="/shop?type=unique" className="hover:text-accent transition-colors">
                  Unique Finds
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-4 text-accent">Connect</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <a
                  href="https://www.tiktok.com/@lathrift"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  TikTok Shop
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/lathrift"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} LA Thrift. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Rare Gems. Branded. Affordable.
          </p>
        </div>
      </div>
    </footer>
  );
}
