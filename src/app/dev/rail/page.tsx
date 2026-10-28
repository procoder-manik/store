import { notFound } from "next/navigation";
import { Storefront, type RailVariant } from "@/components/Storefront";
import { getCatalog } from "@/lib/catalog";

/** Local preview of each 3D style. Not available in production. */
export default async function RailPreview({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { v } = await searchParams;
  const { products, categories } = await getCatalog();
  const variant = (["hanger", "hanger-wire", "hanger-gold", "hanger-velvet", "arc", "coverflow", "diagonal", "stack", "wave"].includes(v ?? "") ? v : "arc") as RailVariant;
  return <Storefront products={products} categories={categories} variant={variant} />;
}
