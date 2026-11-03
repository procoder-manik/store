/** Shared shapes for the promo popup. Safe to import anywhere: no secrets, no server code. */

export type PopupDesign = "classic" | "minimal" | "spotlight" | "coupon" | "sidebyside";
export type PopupPosition = "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "bottom-bar";
export type PopupTrigger = "delay" | "exit" | "scroll" | "click";

export const POPUP_DESIGNS: { id: PopupDesign; name: string; about: string }[] = [
  { id: "classic", name: "Classic", about: "A clean centered card." },
  { id: "minimal", name: "Minimal", about: "Small and quiet, text on the left." },
  { id: "spotlight", name: "Spotlight", about: "A bold coloured panel that stands out." },
  { id: "coupon", name: "Coupon ticket", about: "A torn-ticket look built around the code." },
  { id: "sidebyside", name: "Image beside text", about: "A picture next to the offer. Needs an image." },
];

export const POPUP_POSITIONS: { id: PopupPosition; name: string }[] = [
  { id: "center", name: "Middle of the screen" },
  { id: "bottom-right", name: "Bottom right corner" },
  { id: "bottom-left", name: "Bottom left corner" },
  { id: "top-right", name: "Top right corner" },
  { id: "top-left", name: "Top left corner" },
  { id: "bottom-bar", name: "Bar along the bottom" },
];

export const POPUP_TRIGGERS: { id: PopupTrigger; name: string }[] = [
  { id: "delay", name: "After a few seconds" },
  { id: "exit", name: "When the visitor is about to leave" },
  { id: "scroll", name: "After scrolling down the page" },
  { id: "click", name: "After clicking a button or the page" },
];

export type PopupConfig = {
  enabled: boolean;
  design: PopupDesign;
  position: PopupPosition;
  title: string;
  text: string;
  code: string;
  button: string;
  image: string;
  bg: string; // card background colour, empty = theme
  fg: string; // text colour, empty = theme
  accent: string; // button and code colour, empty = theme
  trigger: PopupTrigger;
  delay: number; // seconds, for the delay trigger
  scrollPercent: number; // 10-100, for the scroll trigger
  clickSelector: string; // CSS selector, for the click trigger (empty = anywhere)
  clickCount: number; // how many clicks before it shows
  maxShows: number;
  gapDays: number;
  hideAfterOrder: boolean;
  hideSignedIn: boolean;
  stopAfterClaim: boolean;
};

export const isPopupDesign = (v: unknown): v is PopupDesign => POPUP_DESIGNS.some((d) => d.id === v);
export const isPopupPosition = (v: unknown): v is PopupPosition => POPUP_POSITIONS.some((p) => p.id === v);
export const isPopupTrigger = (v: unknown): v is PopupTrigger => POPUP_TRIGGERS.some((t) => t.id === v);
