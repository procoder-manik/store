import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings } from "@/lib/settings";
import { EmailTemplateForm, type TemplateInitial } from "@/components/admin/EmailTemplateForm";

export default async function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: t } = await supabase.from("email_templates").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const { brand } = await getPublicSettings();
  const initial: TemplateInitial = { id: t.id, name: t.name, subject: t.subject, heading: t.heading, body: t.body, buttonText: t.button_text ?? "", buttonUrl: t.button_url ?? "", imageUrl: t.image_url ?? "" };
  return (<><h1 className="mb-6 font-display text-2xl font-semibold">Edit email template</h1><EmailTemplateForm initial={initial} brand={brand.name} /></>);
}
