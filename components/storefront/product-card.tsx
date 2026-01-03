"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { formatPrice, CONDITION_LABELS } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface ProductCardProps {
  id: Id<"products">;
  name: string;
  price: number;
  image?: string;
  brand?: string;
  condition: "new" | "like-new" | "good" | "fair";
  type: "unique" | "stock";
  quantity: number;
  status: "active" | "sold" | "hidden";
}

export function ProductCard({
  id,
  name,
  price,
  image,
  brand,
  condition,
  type,
  quantity,
  status,
}: ProductCardProps) {
  const { addItem } = useCart();
  const isSold = status === "sold" || quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSold) return;

    addItem({
      productId: id,
      name,
      price,
      image,
      maxQuantity: quantity,
      type,
    });
  };

  return (
    <Link href={`/shop/${id}`} className="group block">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
        {image && image.startsWith("http") ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 right-2 flex flex-col items-start gap-1">
          {type === "unique" && (
            <Badge className="text-xs font-bold bg-accent text-accent-foreground">
              1 of 1
            </Badge>
          )}
          {brand && (
            <Badge variant="default" className="text-xs font-bold max-w-[90%] truncate">
              {brand}
            </Badge>
          )}
        </div>

        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="text-xl font-bold text-white tracking-wider">SOLD</span>
          </div>
        )}

        {/* Quick Add Button */}
        {!isSold && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-accent transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-accent">{formatPrice(price)}</span>
          <span className="text-xs text-muted">
            {CONDITION_LABELS[condition]}
          </span>
        </div>
      </div>
    </Link>
  );
}
