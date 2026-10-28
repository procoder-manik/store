import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Building2, Mail, MapPin, MessageCircle, Phone, Clock } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { blocksSchema, type Block } from "@/lib/blocks";
import { SITE_URL } from "@/lib/config";
import { INFO_SLUGS, INFO_TITLES, infoDefault, type InfoSlug } from "@/lib/info-pages";
import { getPublicSettings } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";
import { BlockRenderer } from "@/components/Blocks";
import { ContactForm } from "@/components/ContactForm";
import { InfoPage } from "@/components/InfoPage";

export const revalidate = 60;
export const dynamicParams = false;
export const generateStaticParams = () => INFO_SLUGS.map((slug) => ({ slug }));

type Params = { params: Promise<{ slug: string }> };
const isInfo = (s: string): s is InfoSlug => (INFO_SLUGS as readonly string[]).includes(s);

/** A page made in Admin, Pages with the same address replaces the built-in text. */
const custom = cache(async (slug: string) => {
  const sb = createPublicClient();
  if (!sb || slug === "contact") return null;
  const { data } = await sb.from("pages").select("title, description, blocks").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!data) return null;
  const parsed = blocksSchema.safeParse(data.blocks);
  return { title: data.title as string, description: (data.description as string) ?? "", blocks: (parsed.success ? parsed.data : []) as Block[] };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (!isInfo(slug)) return {};
  const { brand, contact } = await getPublicSettings();
  const c = await custom(slug);
  const d = infoDefault(slug, brand.name, contact.email);
  return { title: c?.title ?? d.title, description: c?.description || d.description, alternates: { canonical: `${SITE_URL}/${slug}` } };
}

export default async function Info({ params }: Params) {
  const { slug } = await params;
  if (!isInfo(slug)) notFound();
  const { brand, contact } = await getPublicSettings();
  const c = await custom(slug);

  if (c) {
    const { products, categories } = await getCatalog();
    return <main><BlockRenderer blocks={c.blocks} products={products} categories={categories} /></main>;
  }

  const d = infoDefault(slug, brand.name, contact.email);

  const ld = d.faq ? { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", name: d.title, url: `${SITE_URL}/${slug}`, description: d.description },
    { "@type": "FAQPage", mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ] } : null;

  if (slug === "contact") {
    // Sample details show until you add your own in Admin, Settings, Contact.
    const wa = contact.whatsapp ? `0${contact.whatsapp.replace(/^88/, "")}` : "01XXXXXXXXX";
    const rows = [
      { icon: Building2, label: "Our shop", value: contact.businessName || brand.name, href: "" },
      { icon: Phone, label: "Call us", value: [contact.phone || "01XXXXXXXXX", contact.phone2].filter(Boolean).join(" / "), href: `tel:${contact.phone || ""}` },
      { icon: MessageCircle, label: "WhatsApp", value: wa, href: contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "" },
      { icon: Mail, label: "Email", value: contact.email || "hello@yourstore.com", href: contact.email ? `mailto:${contact.email}` : "" },
      { icon: Clock, label: "Opening hours", value: contact.hours || "Every day, 10am to 8pm", href: "" },
      { icon: MapPin, label: "Address", value: contact.address || "Your shop address, Dhaka, Bangladesh", href: contact.mapUrl },
    ] as { icon: typeof Phone; label: string; value: string; href: string }[];
    return (
      <InfoPage title={d.title} intro={d.intro} current="contact" wide>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-line bg-surface p-6 md:p-8"><h2 className="mb-5 font-display text-xl font-semibold">Send us a message</h2><ContactForm /></div>
          <ul className="grid content-start gap-3">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"><Icon size={16} /></span>
                <span><span className="block text-xs text-muted">{label}</span>{href ? <a href={href} className="break-all font-medium hover:underline">{value}</a> : <span className="font-medium">{value}</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      </InfoPage>
    );
  }

  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <InfoPage title={INFO_TITLES[slug]} intro={d.intro} sections={d.sections} faq={d.faq} current={slug} />
    </>
  );
}
