import { notFound } from "next/navigation";
import { PageBuilder, type PageInitial } from "@/components/admin/PageBuilder";
import { BlockRenderer } from "@/components/Blocks";
import { newBlock, type Block } from "@/lib/blocks";
import { getCatalog } from "@/lib/catalog";

/** Local previews of the builder and the ready-made sections, with sample products. Not available in production. */
function make<T extends Block["type"]>(type: T, patch: Record<string, unknown>): Block {
  return { ...newBlock(type), ...patch } as Block;
}

export default async function BuilderPreview({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { view } = await searchParams;
  const { products, categories } = await getCatalog();
  const [a, b, c] = products;
  const zones = [{ id: "z1", name: "Inside Dhaka", fee: 80, freeOver: 3000 }, { id: "z2", name: "Outside Dhaka", fee: 130, freeOver: null }];

  if (view === "showcase") {
    const blocks: Block[] = [
      make("hero", { variant: "aurora", heading: "Dress your home and yourself", sub: "Clothing, bedding and decor made to be loved for years.", button: "Shop the collection", link: "/shop", level: "h1", anim: "none" }),
      make("marquee", { items: ["Free delivery over 3,000 taka", "Cash on delivery", "New arrivals every week"], look: "accent" }),
      make("stats", { items: [{ value: 5200, suffix: "+", label: "Happy customers" }, { value: 120, suffix: "", label: "Products" }, { value: 64, suffix: "", label: "Districts we deliver to" }] }),
      make("hero", { variant: "bold", heading: "Soft things for slow days", sub: "Heavyweight cotton and linen that gets better with every wash.", button: "Shop now", link: "/shop" }),
      make("slider", { style: "fade", slides: [{ title: "New season, new colors", sub: "Fresh tees and hoodies just landed", image: "", button: "Shop new", link: "/shop?tag=new" }, { title: "Bedding that breathes", sub: "Linen sets from 3,200 taka", image: "", button: "See bedding", link: "/category/bedding" }] }),
      make("countdown", { title: "Eid sale ends soon", text: "Up to 25% off selected tees and hoodies.", endsAt: new Date(Date.now() + 2.4 * 864e5).toISOString().slice(0, 16) }),
      make("testimonials", { items: [{ quote: "The fabric is thick and the fit is perfect. Delivery took two days.", name: "Sumaiya A.", role: "Dhaka" }, { quote: "Colors look exactly like the pictures. I ordered again.", name: "Tanvir H.", role: "Chattogram" }, { quote: "Paid on delivery, checked the parcel first. Very easy.", name: "Nusrat J.", role: "Sylhet" }] }),
    ];
    return <BlockRenderer blocks={blocks} products={products} categories={categories} zones={zones} slug="demo" />;
  }

  const blocks: Block[] = [
    make("hero", { heading: "The softest tee you will own", sub: "Heavyweight cotton that keeps its shape wash after wash.", button: "Order now", link: "#order", variant: "split", level: "h1" }),
    make("features", { title: "Why people love it", items: [{ title: "240 GSM cotton", text: "Thick, soft and does not go see-through." }, { title: "Pre-shrunk", text: "Fits the same after washing." }, { title: "Cash on delivery", text: "Check it first, then pay." }] }),
    make("order", { heading: "Choose your offer", cta: "Order now", multi: true, offers: [
      { id: "o1", label: "Buy 1", badge: "", items: [{ productId: a.id, qty: 1 }], price: a.basePrice },
      { id: "o2", label: "Buy 2 and save", badge: "Best value", items: [{ productId: a.id, qty: 2 }], price: Math.round(a.basePrice * 2 * 0.88) },
      { id: "o3", label: "Tee + Hoodie combo", badge: "Combo", items: [{ productId: a.id, qty: 1 }, { productId: b.id, qty: 1 }], price: Math.round((a.basePrice + b.basePrice) * 0.85) },
      { id: "o4", label: "Tee + Hoodie + Decor", badge: "", items: [{ productId: a.id, qty: 1 }, { productId: b.id, qty: 1 }, { productId: c.id, qty: 1 }], price: Math.round((a.basePrice + b.basePrice + c.basePrice) * 0.8) },
    ] }),
    make("faq", { title: "Questions", items: [{ q: "Can I pay on delivery?", a: "Yes. You pay the courier when the parcel arrives." }] }),
  ];
  if (view === "page") return <BlockRenderer blocks={blocks} products={products} categories={categories} zones={zones} slug="demo" />;
  const initial: PageInitial = { slug: "tee-offer", title: "Tee offer", description: "", status: "draft", blocks };
  return (
    <div data-theme="studio" className="min-h-dvh bg-paper p-6 text-ink">
      <h1 className="mb-6 font-display text-2xl font-semibold">New landing page</h1>
      <PageBuilder initial={initial} products={products} categories={categories} kind="landing" />
    </div>
  );
}
