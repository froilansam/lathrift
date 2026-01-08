"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ChevronLeft, ShoppingBag, Minus, Plus, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/storefront/product-card";
import { formatPrice, CONDITION_LABELS } from "@/lib/utils";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const productId = id as Id<"products">;

  const product = useQuery(api.products.getById, { id: productId });
  const relatedProducts = useQuery(api.products.getRelated, {
    productId,
    limit: 4,
  });
  const category = useQuery(
    api.categories.list
  )?.find((c) => c._id === product?.categoryId);

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  if (product === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-secondary rounded mb-8" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square rounded-lg bg-secondary" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-secondary rounded" />
              <div className="h-10 w-1/3 bg-secondary rounded" />
              <div className="h-24 bg-secondary rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-muted mt-2">
          This product may have been removed or doesn&apos;t exist.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  const isSold = product.status === "sold" || product.quantity <= 0;
  const maxQuantity = Math.min(product.quantity, 10);

  const handleAddToCart = () => {
    if (isSold) return;

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      maxQuantity: product.quantity,
      type: product.type,
      quantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 sm:mb-8">
        <Link
          href="/shop"
          className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Shop
        </Link>
      </nav>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square overflow-hidden rounded-lg bg-secondary"
          >
            {product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <ShoppingBag className="h-16 w-16" />
              </div>
            )}

            {/* Sold Overlay */}
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-2xl font-bold text-white">SOLD</span>
              </div>
            )}
          </motion.div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === index
                      ? "border-accent"
                      : "border-transparent hover:border-muted"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.brand && <Badge>{product.brand}</Badge>}
            {product.type === "unique" && (
              <Badge className="bg-accent text-accent-foreground">One of a Kind</Badge>
            )}
            {category && <Badge variant="outline">{category.name}</Badge>}
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-accent">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Condition */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Condition:</span>
            <span className="text-sm font-medium">
              {CONDITION_LABELS[product.condition]}
            </span>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <p className="text-muted whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Quantity & Add to Cart */}
          {!isSold && (
            <div className="space-y-4 pt-4">
              {/* Quantity Selector (only for stock items) */}
              {product.type === "stock" && product.quantity > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(maxQuantity, quantity + 1))
                      }
                      disabled={quantity >= maxQuantity}
                      className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-muted ml-2">
                      {product.quantity} available
                    </span>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent-light text-accent-foreground"
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Added to Cart
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          )}

          {/* Sold Message */}
          {isSold && (
            <div className="rounded-lg bg-secondary p-4 text-center">
              <p className="font-medium">This item has been sold</p>
              <p className="text-sm text-muted mt-1">
                Check out our other items or follow us for new drops!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16 pt-16 border-t border-border">
          <h2 className="text-xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
            {relatedProducts.map((product, index) => (
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
        </section>
      )}
    </div>
  );
}
