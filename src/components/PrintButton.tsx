"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-pill border border-line px-5 py-2.5 text-sm font-medium hover:bg-surface print:hidden"><Printer size={15} /> Print or save as PDF</button>;
}
