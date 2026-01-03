"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import { Upload, X, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductFormProps {
  productId?: Id<"products"> | null;
  onClose: () => void;
}

export function ProductForm({ productId, onClose }: ProductFormProps) {
  const product = useQuery(
    api.products.getById,
    productId ? { id: productId } : "skip"
  );
  const categories = useQuery(api.categories.list);

  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    categoryId: product?.categoryId ?? "",
    type: product?.type ?? "unique",
    quantity: product?.quantity?.toString() ?? "1",
    brand: product?.brand ?? "",
    condition: product?.condition ?? "good",
    featured: product?.featured ?? false,
    status: product?.status ?? "active",
  });

  // Update form when product loads
  if (product && !formData.name && product.name) {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId,
      type: product.type,
      quantity: product.quantity.toString(),
      brand: product.brand ?? "",
      condition: product.condition,
      featured: product.featured,
      status: product.status,
    });
    setImages(product.images);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error("Upload failed");

        const { storageId } = await result.json();
        newImages.push(storageId);
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.categoryId) {
      alert("Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      alert("Please add at least one image");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        images,
        categoryId: formData.categoryId as Id<"categories">,
        type: formData.type as "unique" | "stock",
        quantity: formData.type === "unique" ? 1 : parseInt(formData.quantity),
        brand: formData.brand || undefined,
        condition: formData.condition as
          | "new"
          | "like-new"
          | "good"
          | "fair",
        featured: formData.featured,
      };

      if (productId) {
        await updateProduct({
          id: productId,
          ...data,
          status: formData.status as "active" | "sold" | "hidden",
        });
      } else {
        await createProduct(data);
      }

      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {productId ? "Edit Product" : "Add Product"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Images <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <ImagePreview
                key={index}
                storageId={image}
                onRemove={() => removeImage(index)}
              />
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-muted transition-colors"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Plus className="h-6 w-6 text-muted" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Basic Info */}
        <Input
          label="Product Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Vintage Nike Windbreaker"
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the item, include measurements, condition details..."
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Price (PHP)"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            placeholder="0"
            min="0"
            required
          />
          <Input
            label="Brand (optional)"
            value={formData.brand}
            onChange={(e) =>
              setFormData({ ...formData, brand: e.target.value })
            }
            placeholder="e.g., Nike, Adidas"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Condition
            </label>
            <select
              value={formData.condition}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="new">Brand New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                  quantity: e.target.value === "unique" ? "1" : formData.quantity,
                })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="unique">Unique (1 item)</option>
              <option value="stock">Stock (multiple)</option>
            </select>
          </div>
          {formData.type === "stock" && (
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              min="1"
            />
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) =>
                setFormData({ ...formData, featured: e.target.checked })
              }
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Featured product</span>
          </label>
        </div>

        {/* Status (edit only) */}
        {productId && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSubmitting}>
            {productId ? "Save Changes" : "Add Product"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function ImagePreview({
  storageId,
  onRemove,
}: {
  storageId: string;
  onRemove: () => void;
}) {
  const url = useQuery(api.files.getUrl, { storageId });

  return (
    <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-secondary group">
      {url ? (
        <Image src={url} alt="Product" fill className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
