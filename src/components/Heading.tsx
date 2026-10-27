import type { HeadingLevel } from "@/lib/blocks";

/** A heading whose tag (h1 to h6) is chosen by you for search engines, while its size and look stay the same. */
export function Heading({ as = "h2", className, children }: { as?: HeadingLevel; className?: string; children: React.ReactNode }) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}
