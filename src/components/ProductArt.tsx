import type { Kind } from "@/lib/demo-products";

const clamp = (n: number) => Math.max(0, Math.min(255, n));
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => clamp(v + amt).toString(16).padStart(2, "0");
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/** Clean illustrated stand-in for products that do not have a photo yet. */
export function ProductArt({ kind, color, className = "" }: { kind: Kind; color: string; className?: string }) {
  const dark = shade(color, -30);
  const light = shade(color, 24);
  const gid = `g${color.slice(1)}${kind}`;
  return (
    <div className={`grid place-items-center bg-gradient-to-b from-surface to-paper ${className}`}>
      <svg viewBox="0 0 200 250" role="img" aria-hidden className="h-auto w-4/5 drop-shadow-[0_12px_14px_rgba(0,0,0,0.14)]">
        {kind === "tee" && (
          <>
            <path d="M68 36 Q100 62 132 36 L176 56 L196 104 L162 118 L150 96 L150 216 Q100 226 50 216 L50 96 L38 118 L4 104 L24 56 Z" fill={color} />
            <path d="M68 36 Q100 62 132 36 Q100 50 68 36 Z" fill={dark} />
            <path d="M150 96 L150 216 Q125 221 110 222 L110 100 Z" fill="rgba(0,0,0,0.05)" />
            <path d="M50 216 Q100 226 150 216" stroke={dark} strokeWidth="2" fill="none" opacity="0.5" />
          </>
        )}
        {kind === "hoodie" && (
          <>
            <ellipse cx="100" cy="50" rx="36" ry="30" fill={dark} />
            <path d="M70 54 Q100 74 130 54 L174 72 L198 196 L170 202 L152 118 L152 224 Q100 234 48 224 L48 118 L30 202 L2 196 L26 72 Z" fill={color} />
            <path d="M74 54 Q100 80 126 54 Q100 34 74 54 Z" fill="rgba(0,0,0,0.38)" />
            <path d="M70 168 L130 168 L140 206 L60 206 Z" fill={light} opacity="0.55" />
            <path d="M92 74 L90 112 M108 74 L110 112" stroke="#f4f1ea" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {kind === "cover" && (
          <>
            <rect x="30" y="150" width="140" height="38" rx="9" fill={dark} />
            <rect x="26" y="114" width="148" height="40" rx="9" fill={color} />
            <rect x="34" y="80" width="132" height="38" rx="9" fill={light} />
            <rect x="40" y="46" width="120" height="38" rx="9" fill={color} />
            <path d="M46 66 H154 M32 134 H168" stroke={dark} strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />
          </>
        )}
        {kind === "decor" && (
          <>
            <defs>
              <radialGradient id={gid} cx="0.38" cy="0.32" r="0.8">
                <stop offset="0" stopColor="#f6f9fb" />
                <stop offset="1" stopColor="#aab7c2" />
              </radialGradient>
            </defs>
            <path d="M100 18 L70 68 M100 18 L130 68" stroke="#8a8f98" strokeWidth="2" />
            <circle cx="100" cy="132" r="74" fill={color} />
            <circle cx="100" cy="132" r="64" fill={`url(#${gid})`} />
            <path d="M62 160 L96 84 L108 84 L74 160 Z" fill="rgba(255,255,255,0.45)" />
          </>
        )}
      </svg>
    </div>
  );
}
