import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { EmailBuilder } from "@/components/admin/EmailBuilder";
import { emailDesignSchema, legacyToDesign } from "@/lib/email-builder";

export default async function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: t } = await supabase.from("email_templates").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const [{ brand }, { products }] = await Promise.all([getPublicSettings(), getCatalog()]);
  const saved = emailDesignSchema.safeParse(t.blocks);
  const design = saved.success ? saved.data : legacyToDesign(t);
  return (<><h1 className="mb-6 font-display text-2xl font-semibold">Edit email</h1><EmailBuilder initial={{ id: t.id, name: t.name, subject: t.subject, design }} products={products} brand={brand.name} logo={brand.logo} /></>);
}
