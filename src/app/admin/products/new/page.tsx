import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProduct() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  const { data: allProducts } = await supabase.from("products").select("id, name").order("name");
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold">Add product</h1>
      <ProductForm categories={categories ?? []} allProducts={allProducts ?? []} />
    </>
  );
}
