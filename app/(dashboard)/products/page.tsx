"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAPI } from "@/lib/hooks/use-api";
import { useCart } from "@/lib/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

// ─── Category grouping map ────────────────────────────────────────────────────
// Maps each product `type` to a broader display category
const TYPE_TO_CATEGORY: Record<string, string> = {
  // Tops
  "Tops": "Tops",
  "Tops & Tshirts": "Tops",
  "Shirts, Tops & Tunic": "Tops",
  "Tshirts": "T-Shirts",
  "Polo T-shirts": "T-Shirts",

  // Dresses
  "Dresses": "Dresses",
  "Dresses & Gowns": "Dresses",
  "Dresses & Frocks": "Dresses",

  // Sweatshirts & Hoodies
  "Sweatshirt & Hoodies": "Sweatshirts",
  "Sweaters & Cardigans": "Sweatshirts",

  // Bottoms
  "Trousers & Pants": "Bottoms",
  "Skirts": "Bottoms",
  "Jeans & Jeggings": "Bottoms",
  "Shorts": "Bottoms",
  "Leggings & Jeggings": "Bottoms",
  "Palazzos": "Bottoms",

  // Outerwear
  "Jackets & Coats": "Outerwear",
  "Shrugs & Jackets": "Outerwear",
  "Blazers": "Outerwear",
  "Waistcoats": "Outerwear",

  // Jumpsuits
  "Jumpsuits &Playsuits": "Jumpsuits",
  "Jumpsuits & Playsuits": "Jumpsuits",
  "Suit Sets": "Jumpsuits",

  // Innerwear
  "Camisoles & Slips": "Innerwear",
  "Trunks": "Innerwear",
  "Boxers": "Innerwear",
  "Briefs": "Innerwear",
  "Bras": "Innerwear",
  "Night&LoungeWearSets": "Innerwear",
  "Nightwear": "Innerwear",

  // Ethnic
  "Kurtis & Tunics": "Ethnic",
  "Kurtis": "Ethnic",
  "Sarees": "Ethnic",
  "Lehengas": "Ethnic",
  "Salwar Suits": "Ethnic",
  "Dupatta & Stoles": "Ethnic",
  "Kurta Pyjama Sets": "Ethnic",
  "Sherwanis": "Ethnic",

  // Shirts
  "Shirts": "Shirts",

  // Accessories
  "Bracelets & Bangles": "Accessories",
  "Bracelets & Kadas": "Accessories",
  "Necklaces & Pendants": "Accessories",
  "Chains": "Accessories",
  "Earrings": "Accessories",
  "Rings": "Accessories",
  "Socks": "Accessories",
  "Rakhis": "Accessories",
  "Watches": "Accessories",
  "Sunglasses": "Accessories",
  "Belts": "Accessories",
  "Wallets": "Accessories",
  "Bags & Backpacks": "Accessories",
};

// ─── Category display order ───────────────────────────────────────────────────
const CATEGORY_ORDER = [
  "All",
  "Tops",
  "T-Shirts",
  "Dresses",
  "Sweatshirts",
  "Shirts",
  "Bottoms",
  "Outerwear",
  "Jumpsuits",
  "Innerwear",
  "Ethnic",
  "Accessories",
  "Other",
];

function getDisplayCategory(type: string): string {
  return TYPE_TO_CATEGORY[type] ?? "Other";
}

export default function ProductsPage() {
  const { data: productsData, isLoading } = useAPI<{ products: Product[]; total: number } | Product[]>("/products");
  const products: Product[] = Array.isArray(productsData)
    ? productsData
    : (productsData as { products: Product[] })?.products ?? [];
  const { addToCart } = useCart();

  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [category, setCategory] = useState("all");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Gender tabs — derived from all products
  const genderTabs = useMemo(() => {
    if (!products.length) return [{ label: "All", value: "all" }];
    const genders = Array.from(new Set(products.map((p) => p.gender).filter(Boolean))).sort();
    return [
      { label: `All (${products.length})`, value: "all" },
      ...genders.map((g) => ({
        label: `${g} (${products.filter((p) => p.gender === g).length})`,
        value: g as string,
      })),
    ];
  }, [products]);

  // Products filtered by gender + search (used to compute category tabs)
  const genderFiltered = useMemo(() => {
    return products.filter((p) => {
      const matchesGender = gender === "all" || p.gender === gender;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.type || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.gender || "").toLowerCase().includes(search.toLowerCase());
      return matchesGender && matchesSearch && p.isActive;
    });
  }, [products, gender, search]);

  // Category tabs — derived from gender-filtered products, sorted by CATEGORY_ORDER
  const categoryTabs = useMemo(() => {
    const cats = new Map<string, number>();
    genderFiltered.forEach((p) => {
      const cat = getDisplayCategory(p.type || "");
      cats.set(cat, (cats.get(cat) ?? 0) + 1);
    });
    if (cats.size <= 1) return [];

    const sorted = CATEGORY_ORDER
      .filter((c) => cats.has(c))
      .map((c) => ({ label: `${c} (${cats.get(c)})`, value: c }));

    // Any categories not in CATEGORY_ORDER appended at end
    cats.forEach((count, cat) => {
      if (!CATEGORY_ORDER.includes(cat)) {
        sorted.push({ label: `${cat} (${count})`, value: cat });
      }
    });

    return [{ label: `All (${genderFiltered.length})`, value: "all" }, ...sorted];
  }, [genderFiltered]);

  // Reset category tab when gender changes
  const handleGenderChange = (g: string) => {
    setGender(g);
    setCategory("all");
  };

  // Final filtered products
  const filtered = useMemo(() => {
    if (category === "all") return genderFiltered;
    return genderFiltered.filter((p) => getDisplayCategory(p.type || "") === category);
  }, [genderFiltered, category]);

  const handleAddToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
    } catch {
      // Toast will handle error display
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-muted text-sm">Browse our catalog and add items to your cart.</p>
        </div>
        {!isLoading && (
          <span className="text-sm text-muted bg-surface-2 border border-border rounded-xl px-3 py-1.5 shrink-0">
            {filtered.length} of {products.length} products
          </span>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Search products, type, gender..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        }
      />

      {/* Row 1: Gender filter */}
      {genderTabs.length > 1 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Gender</p>
          <Tabs tabs={genderTabs} activeTab={gender} onChange={handleGenderChange} />
        </div>
      )}

      {/* Row 2: Category filter (only shows when there are multiple categories) */}
      {!isLoading && categoryTabs.length > 1 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Category</p>
          <Tabs tabs={categoryTabs} activeTab={category} onChange={setCategory} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          }
          title="No products found"
          description="Try adjusting your search or filters."
        />
      )}

      {/* Products Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <div key={product.id} className="glass rounded-2xl overflow-hidden flex flex-col">
              {/* Product Image */}
              <Link href={`/products/${product.id}`}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-48 w-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-accent/20 to-accent-2/20 flex items-center justify-center">
                    <svg className="h-12 w-12 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* Product Info */}
              <div className="flex flex-col flex-1 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${product.id}`} className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <Badge variant="info" className="shrink-0 text-xs">
                    {getDisplayCategory(product.type || "")}
                  </Badge>
                </div>

                {product.sizes && (
                  <p className="text-xs text-muted truncate">
                    {product.sizes}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                  {product.gender && (
                    <Badge>{product.gender}</Badge>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  isLoading={addingId === product.id}
                  onClick={() => handleAddToCart(product.id)}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
