"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const featuredProducts = useQuery(api.products.getFeatured, { limit: 8 });
  const newArrivals = useQuery(api.products.getNewArrivals, { limit: 4 });
  const categories = useQuery(api.categories.list);

  return (
    <div>
      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide">
              <Link
                href="/shop"
                className="whitespace-nowrap px-4 py-2 text-sm font-medium hover:text-accent transition-colors"
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/shop?category=${category.slug}`}
                  className="whitespace-nowrap px-4 py-2 text-sm font-medium text-muted hover:text-accent transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold">Featured Picks</h2>
            <Link
              href="/shop?featured=true"
              className="text-sm font-medium text-accent hover:text-accent-light transition-colors flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {featuredProducts === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-lg bg-secondary" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-secondary" />
                  <div className="mt-2 h-5 w-1/2 rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-muted py-12">
              No featured products yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    image={product.images[0]}
                    brand={product.brand}
                    condition={product.condition}
                    type={product.type}
                    quantity={product.quantity}
                    status={product.status}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 sm:py-16 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold">New Arrivals</h2>
            <Link
              href="/shop"
              className="text-sm font-medium text-accent hover:text-accent-light transition-colors flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {newArrivals === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-lg bg-secondary" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-secondary" />
                  <div className="mt-2 h-5 w-1/2 rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : newArrivals.length === 0 ? (
            <p className="text-center text-muted py-12">
              New products coming soon!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    image={product.images[0]}
                    brand={product.brand}
                    condition={product.condition}
                    type={product.type}
                    quantity={product.quantity}
                    status={product.status}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TikTok CTA */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary p-8 sm:p-12 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm text-accent font-medium mb-2">New Drops Every Week</p>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Watch Us on TikTok
                </h2>
                <p className="mt-2 text-primary-foreground/70">
                  See our latest finds + get styling inspo
                </p>
              </div>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent-light text-accent-foreground px-8 shrink-0"
                asChild
              >
                <a
                  href="https://tiktok.com/@l.athrift"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @l.athrift
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
