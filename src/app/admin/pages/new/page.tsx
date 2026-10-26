import { getCatalog } from "@/lib/catalog";
import { PageBuilder } from "@/components/admin/PageBuilder";

export default async function NewPage() {
  const { products, categories } = await getCatalog();
  return (<><h1 className="mb-6 font-display text-2xl font-semibold">New page</h1><PageBuilder products={products} categories={categories} /></>);
}
