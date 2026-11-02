import type { SOCIALS } from "@/lib/social-icons";

/** A round badge in the network's own colour. Black brands follow the page's text colour, so they stay visible on light and dark. */
export function SocialIcon({ net, size = 40 }: { net: (typeof SOCIALS)[number]; size?: number }) {
  return (
    <span aria-hidden style={{ width: size, height: size, background: net.bg, color: net.fg }} className="grid shrink-0 place-items-center rounded-full">
      <svg viewBox="0 0 24 24" width={Math.round(size * 0.52)} height={Math.round(size * 0.52)} fill="currentColor"><path d={net.path} /></svg>
    </span>
  );
}
