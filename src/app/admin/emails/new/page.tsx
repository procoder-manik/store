import { EmailBuilder } from "@/components/admin/EmailBuilder";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { DEFAULT_DESIGN } from "@/lib/email-builder";

export default async function NewTemplate() {
  const [{ brand }, { products }] = await Promise.all([getPublicSettings(), getCatalog()]);
  return (<><h1 className="mb-6 font-display text-2xl font-semibold">New email</h1><EmailBuilder initial={{ name: "", subject: "", design: DEFAULT_DESIGN() }} products={products} brand={brand.name} logo={brand.logo} /></>);
}
