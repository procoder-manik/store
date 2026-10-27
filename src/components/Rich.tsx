/** Plain text with blank lines between paragraphs and "- " bullet lists. Never treated as HTML. */
export function Rich({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => {
        const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
        if (!lines.length) return null;
        const bullets = lines.filter((l) => l.startsWith("- "));
        const rest = lines.filter((l) => !l.startsWith("- "));
        return (
          <div key={i} className={`grid gap-2 ${className}`}>
            {rest.length > 0 && <p>{rest.join(" ")}</p>}
            {bullets.length > 0 && <ul className="grid gap-2 pl-5 [&>li]:list-disc">{bullets.map((l) => <li key={l}>{l.slice(2)}</li>)}</ul>}
          </div>
        );
      })}
    </>
  );
}
