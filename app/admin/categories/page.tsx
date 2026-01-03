"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Edit, Trash2, GripVertical, FolderTree } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      if (editingId) {
        await updateCategory({
          id: editingId,
          name,
          slug: slug || slugify(name),
          description: description || undefined,
        });
      } else {
        await createCategory({
          name,
          slug: slug || slugify(name),
          description: description || undefined,
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save category");
    }
  };

  const handleEdit = (category: {
    _id: Id<"categories">;
    name: string;
    slug: string;
    description?: string;
  }) => {
    setEditingId(category._id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setShowForm(true);
  };

  const handleDelete = async (id: Id<"categories">) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory({ id });
      } catch (error) {
        alert("Cannot delete category with products");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted">{categories?.length ?? 0} category(s)</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border p-4 space-y-4"
        >
          <h2 className="font-medium">
            {editingId ? "Edit Category" : "New Category"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId) {
                  setSlug(slugify(e.target.value));
                }
              }}
              placeholder="e.g., Tops"
              required
            />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., tops"
            />
          </div>
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
          />
          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? "Save Changes" : "Add Category"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="rounded-lg border border-border overflow-hidden">
        {categories === undefined ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <FolderTree className="h-12 w-12 mx-auto mb-4" />
            <p>No categories yet</p>
            <p className="text-sm">Create your first category to organize products</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between p-4 hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted" />
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted">/{category.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="p-2 rounded-lg hover:bg-secondary text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
