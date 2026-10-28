import type { HeadingLevel } from "@/lib/blocks";

/**
 * A heading whose tag (h1 to h6, or a plain p) is chosen in the page builder.
 * The data attributes let the section's size, weight and case settings reach it (see globals.css).
 */
export function Heading({ as = "h2", className, children }: { as?: HeadingLevel; className?: string; children: React.ReactNode }) {
  const Tag = as;
  return <Tag data-heading="" data-lv={as} className={className}>{children}</Tag>;
}
