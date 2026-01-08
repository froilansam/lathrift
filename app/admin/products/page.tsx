"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice, CONDITION_LABELS } from "@/lib/utils";
import { ProductForm } from "@/components/admin/product-form";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(action === "new");
  const [editingProduct, setEditingProduct] = useState<Id<"products"> | null>(
    null
  );
  const [menuOpen, setMenuOpen] = useState<Id<"products"> | null>(null);

  const products = useQuery(api.products.list, {});
  const categories = useQuery(api.categories.list);
  const toggleFeatured = useMutation(api.products.toggleFeatured);
  const updateStatus = useMutation(api.products.updateStatus);
  const deleteProduct = useMutation(api.products.remove);

  // Filter products by search
  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (id: Id<"products">) => {
    setEditingProduct(id);
    setShowForm(true);
    setMenuOpen(null);
  };

  const handleDelete = async (id: Id<"products">) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct({ id });
    }
    setMenuOpen(null);
  };

  const handleToggleFeatured = async (id: Id<"products">) => {
    await toggleFeatured({ id });
    setMenuOpen(null);
  };

  const handleToggleHidden = async (
    id: Id<"products">,
    currentStatus: string
  ) => {
    await updateStatus({
      id,
      status: currentStatus === "hidden" ? "active" : "hidden",
    });
    setMenuOpen(null);
  };

  const getCategoryName = (categoryId: Id<"categories">) => {
    return categories?.find((c) => c._id === categoryId)?.name ?? "Unknown";
  };

  if (showForm) {
    return (
      <div>
        <button
          onClick={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          className="text-sm text-muted hover:text-foreground mb-4"
        >
          ← Back to Products
        </button>
        <ProductForm
          productId={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted">
            {filteredProducts?.length ?? 0} product(s)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products - Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredProducts === undefined ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-border p-12 text-center text-muted">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 rounded-lg bg-secondary overflow-hidden">
                  {product.images?.[0] && product.images[0].startsWith("http") ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted truncate">
                        {product.brand && `${product.brand} • `}
                        {getCategoryName(product.categoryId)}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === product._id ? null : product._id)
                        }
                        className="rounded-lg p-1.5 hover:bg-secondary"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === product._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg py-1">
                            <button
                              onClick={() => handleEdit(product._id)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleFeatured(product._id)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                            >
                              {product.featured ? (
                                <>
                                  <StarOff className="h-4 w-4" />
                                  Unfeature
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4" />
                                  Feature
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleHidden(product._id, product.status)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                            >
                              {product.status === "hidden" ? (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Show
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Hide
                                </>
                              )}
                            </button>
                            <hr className="my-1 border-border" />
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-secondary"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-bold text-accent">{formatPrice(product.price)}</span>
                    <StatusBadge status={product.status} />
                    {product.featured && <Star className="h-3 w-3 text-accent fill-accent" />}
                    <span className="text-xs text-muted">
                      {product.type === "unique" ? "Unique" : `${product.quantity} pcs`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden md:block rounded-lg border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts === undefined ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-12 animate-pulse rounded bg-secondary" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg bg-secondary overflow-hidden">
                          {product.images?.[0] && product.images[0].startsWith("http") ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-2">
                            {product.brand && (
                              <span className="text-xs text-muted">{product.brand}</span>
                            )}
                            {product.featured && (
                              <Star className="h-3 w-3 text-accent fill-accent" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{getCategoryName(product.categoryId)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3 text-sm">
                      {product.type === "unique" ? (
                        <span className="text-muted">Unique</span>
                      ) : (
                        <span>{product.quantity} pcs</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === product._id ? null : product._id)
                          }
                          className="rounded-lg p-2 hover:bg-secondary"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpen === product._id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg py-1">
                              <button
                                onClick={() => handleEdit(product._id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(product._id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                              >
                                {product.featured ? (
                                  <>
                                    <StarOff className="h-4 w-4" />
                                    Unfeature
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4" />
                                    Feature
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleToggleHidden(product._id, product.status)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                              >
                                {product.status === "hidden" ? (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    Show
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-4 w-4" />
                                    Hide
                                  </>
                                )}
                              </button>
                              <hr className="my-1 border-border" />
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-secondary"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "active" | "sold" | "hidden";
}) {
  const variants: Record<string, "success" | "destructive" | "secondary"> = {
    active: "success",
    sold: "destructive",
    hidden: "secondary",
  };

  const labels: Record<string, string> = {
    active: "Active",
    sold: "Sold",
    hidden: "Hidden",
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {labels[status]}
    </Badge>
  );
}
