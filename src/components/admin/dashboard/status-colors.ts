const COLORS: Record<string, string> = { pending: "#e0a226", confirmed: "#3b82c4", processing: "#6366c9", shipped: "#8b5cc4", delivered: "#2f9e62", cancelled: "#d14343", returned: "#8a8f98" };
export const statusColor = (s: string) => COLORS[s] ?? "#8a8f98";
