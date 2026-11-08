import { createClient } from "@/lib/supabase/server";
import { importTokenInfo, loadImportSettings } from "@/lib/import-config";
import { ImportAdmin } from "@/components/admin/ImportAdmin";

export const metadata = { title: "Import products" };
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const sb = await createClient();
  const [settings, token, cats] = await Promise.all([
    loadImportSettings(),
    importTokenInfo(),
    sb.from("categories").select("id, name").eq("active", true).order("sort").order("name"),
  ]);
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Import products</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Open a product on Temu, AliExpress, Alibaba, Amazon, Daraz or almost any shop, press the extension button, and the product arrives here as a draft: pictures copied into your own storage, sizes and designs as options, price in taka with your margin added. You check it, then publish.
      </p>
      <div className="mt-6 max-w-3xl">
        <ImportAdmin settings={settings} tokenSet={token.exists} tokenDate={token.createdAt ?? ""} categories={(cats.data ?? []) as { id: string; name: string }[]} />
      </div>
    </>
  );
}
