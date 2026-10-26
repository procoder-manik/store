import { EmailTemplateForm } from "@/components/admin/EmailTemplateForm";
import { getPublicSettings } from "@/lib/settings";

export default async function NewTemplate() {
  const { brand } = await getPublicSettings();
  return (<><h1 className="mb-6 font-display text-2xl font-semibold">New email template</h1><EmailTemplateForm brand={brand.name} /></>);
}
