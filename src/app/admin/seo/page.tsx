import { createClient } from "@/lib/supabase/server";
import { SeoTable, type SeoRow } from "@/components/admin/SeoTable";

export default async function Seo() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, name, seo").order("created_at", { ascending: false }).limit(300);
  const rows: SeoRow[] = (data ?? []).map((p) => { const s = (p.seo ?? {}) as { title?: string; description?: string }; return { id: p.id as string, name: p.name as string, title: s.title ?? "", description: s.description ?? "" }; });
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Search listings</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">The title and description Google shows for each product. The AI writes them from your product text. It also writes photo prompts you can give to a photographer or an image tool. Needs GEMINI_API_KEY or ANTHROPIC_API_KEY.</p>
      <SeoTable rows={rows} />
    </>
  );
}
