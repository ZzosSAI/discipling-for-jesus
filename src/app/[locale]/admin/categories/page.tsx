"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2, FolderTree } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  order: number
  _count: { resources: number }
}

export default function AdminCategoriesPage() {
  const t = useTranslations("admin")
  const tc = useTranslations("common")
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
  }, [])

  async function handleCreate() {
    if (!newName || !newSlug) return
    setLoading(true)

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        slug: newSlug.toLowerCase().replace(/\s+/g, "-"),
        order: categories.length,
      }),
    })

    if (res.ok) {
      const cat = await res.json()
      setCategories([...categories, cat])
      setNewName("")
      setNewSlug("")
      toast.success("Category created!")
    } else {
      toast.error("Failed to create category")
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCategories(categories.filter((c) => c.id !== id))
      toast.success("Category deleted")
    } else {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href="/en/admin"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc("admin")}
        </Link>
        <h1 className="text-3xl font-bold">{t("manageCategories")}</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("addCategory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>{tc("name")}</Label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }}
                placeholder="Category name"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Slug</Label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={loading}>
                {t("save")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{t("noCategories")}</p>
          </div>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    <CardDescription>
                      /{cat.slug} &middot; {cat._count.resources} resources
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
