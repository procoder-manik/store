import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/Blocks";
import { newBlock, type Block, type BlockType } from "@/lib/blocks";
import { getCatalog } from "@/lib/catalog";

/** Local preview of sections used as a page's title section. Not available in production. */
export default async function TitlePreview({ searchParams }: { searchParams: Promise<{ type?: string; home?: string; off?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { type, home, off } = await searchParams;
  const { products, categories } = await getCatalog();
  const block = { ...newBlock((type ?? "rail3d") as BlockType), id: "preview", anim: "none", style: "arc", titleMode: !off, crumbs: !off } as Block;
  return <BlockRenderer blocks={[block]} products={products} categories={categories} page={home ? undefined : { title: "Bedroom ideas", description: "Sheets, quilts and pillows that work together." }} />;
}
