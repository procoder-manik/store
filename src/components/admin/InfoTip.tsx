import { Info } from "lucide-react";

/** A small (i) button. Hover, tap or keyboard-focus it to read why a feature exists and how to use it. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1.5 inline-flex align-middle">
      <button type="button" aria-label="What is this?" className="grid h-4 w-4 place-items-center rounded-full text-muted transition hover:text-accent focus-visible:text-accent"><Info size={14} /></button>
      <span role="tooltip" className="invisible absolute left-0 top-full z-50 mt-1.5 w-64 max-w-[75vw] rounded-xl border border-line bg-surface p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink shadow-xl group-focus-within:visible group-hover:visible">{text}</span>
    </span>
  );
}
