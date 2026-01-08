"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "price-low" | "price-high";

function ShopContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const featuredOnly = searchParams.get("featured") === "true";

  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = useQuery(api.categories.list);
  const selectedCategory = categorySlug
    ? categories?.find((c) => c.slug === categorySlug)
    : null;

  const products = useQuery(api.products.list, {
    categoryId: selectedCategory?._id,
    status: "active",
    featured: featuredOnly ? true : undefined,
  });

  // Sort products
  const sortedProducts = products
    ? [...products].sort((a, b) => {
        switch (sort) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          default:
            return b.createdAt - a.createdAt;
        }
      })
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {featuredOnly
              ? "Featured"
              : selectedCategory
                ? selectedCategory.name
                : "All Products"}
          </h1>
          {sortedProducts && (
            <p className="text-xs sm:text-sm text-muted mt-1">
              {sortedProducts.length}{" "}
              {sortedProducts.length === 1 ? "item" : "items"}
            </p>
          )}
        </div>

        {/* Mobile Filter Button */}
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-medium mb-3">Categories</h3>
              <nav className="space-y-1">
                <CategoryLink
                  href="/shop"
                  active={!categorySlug && !featuredOnly}
                >
                  All
                </CategoryLink>
                <CategoryLink
                  href="/shop?featured=true"
                  active={featuredOnly}
                >
                  Featured
                </CategoryLink>
                {categories?.map((category) => (
                  <CategoryLink
                    key={category._id}
                    href={`/shop?category=${category.slug}`}
                    active={categorySlug === category.slug}
                  >
                    {category.name}
                  </CategoryLink>
                ))}
              </nav>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-medium mb-3">Sort By</h3>
              <div className="space-y-1">
                <SortButton
                  active={sort === "newest"}
                  onClick={() => setSort("newest")}
                >
                  Newest
                </SortButton>
                <SortButton
                  active={sort === "price-low"}
                  onClick={() => setSort("price-low")}
                >
                  Price: Low to High
                </SortButton>
                <SortButton
                  active={sort === "price-high"}
                  onClick={() => setSort("price-high")}
                >
                  Price: High to Low
                </SortButton>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 z-50 h-full w-80 bg-background p-6 shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 hover:bg-secondary rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="font-medium mb-3">Categories</h3>
                  <nav className="space-y-1">
                    <CategoryLink
                      href="/shop"
                      active={!categorySlug && !featuredOnly}
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      All
                    </CategoryLink>
                    <CategoryLink
                      href="/shop?featured=true"
                      active={featuredOnly}
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      Featured
                    </CategoryLink>
                    {categories?.map((category) => (
                      <CategoryLink
                        key={category._id}
                        href={`/shop?category=${category.slug}`}
                        active={categorySlug === category.slug}
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        {category.name}
                      </CategoryLink>
                    ))}
                  </nav>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="font-medium mb-3">Sort By</h3>
                  <div className="space-y-1">
                    <SortButton
                      active={sort === "newest"}
                      onClick={() => {
                        setSort("newest");
                        setMobileFiltersOpen(false);
                      }}
                    >
                      Newest
                    </SortButton>
                    <SortButton
                      active={sort === "price-low"}
                      onClick={() => {
                        setSort("price-low");
                        setMobileFiltersOpen(false);
                      }}
                    >
                      Price: Low to High
                    </SortButton>
                    <SortButton
                      active={sort === "price-high"}
                      onClick={() => {
                        setSort("price-high");
                        setMobileFiltersOpen(false);
                      }}
                    >
                      Price: High to Low
                    </SortButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {sortedProducts === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-lg bg-secondary" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-secondary" />
                  <div className="mt-2 h-5 w-1/2 rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-muted mb-4">No products found</p>
              <Button variant="outline" asChild>
                <a href="/shop">View All Products</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
              {sortedProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
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
      </div>
    </div>
  );
}

function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-secondary rounded mb-8" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] rounded-lg bg-secondary" />
              <div className="mt-3 h-4 w-3/4 rounded bg-secondary" />
              <div className="mt-2 h-5 w-1/2 rounded bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopContent />
    </Suspense>
  );
}

function CategoryLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "block px-3 py-2 text-sm rounded-lg transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </a>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
