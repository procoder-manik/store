import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Tracking } from "@/components/Tracking";
import { ConsentGate } from "@/components/ConsentGate";
import { StoreOnly } from "@/components/StoreOnly";
import { isPalette } from "@/lib/palettes";
import { PromoPopup } from "@/components/PromoPopup";
import { SocialProof } from "@/components/SocialProof";
import { CompareBar } from "@/components/CompareBar";
import { ChatWidget } from "@/components/ChatWidget";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  return {
    title: { default: s.brand.name, template: `%s | ${s.brand.name}` },
    description: s.brand.tagline,
    verification: s.tracking.gscToken ? { google: s.tracking.gscToken } : undefined,
  };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ categories }, s] = await Promise.all([getCatalog(), getPublicSettings()]);
  const a = s.announcement;
  const bar = "block bg-ink px-4 py-2 text-center text-xs text-paper";
  return (
    <html lang="en" suppressHydrationWarning data-palette={isPalette(s.appearance.palette) ? s.appearance.palette : "tide"} className={`${display.variable} ${body.variable}`}>
      <head>
        {s.appearance.visitorPicker && <script dangerouslySetInnerHTML={{ __html: "try{var p=localStorage.getItem('palette');if(p&&/^[a-z]{3,12}$/.test(p))document.documentElement.setAttribute('data-palette',p)}catch(e){}" }} />}
      </head>
      <body>
        <Providers>
          <StoreOnly>
            {a.enabled && a.text && (a.link ? <Link href={a.link} className={bar}>{a.text}</Link> : <div className={bar}>{a.text}</div>)}
            <Header brand={s.brand.name} links={s.header.links} categories={categories} palettePicker={s.appearance.visitorPicker} />
          </StoreOnly>
          {children}
          <StoreOnly><Footer categories={categories} brand={s.brand} footer={s.footer} contact={s.contact} /></StoreOnly>
          <CartDrawer />
          <PromoPopup p={s.popup} />
          <CompareBar />
          {s.chat.enabled && <ChatWidget name={s.chat.name} greeting={s.chat.greeting} />}
          {s.proof.mode !== "off" && <SocialProof />}
        </Providers>
        <ConsentGate ask={s.tracking.consent && !!(s.tracking.fbPixel || s.tracking.ga4 || s.tracking.gtm)}><Tracking t={s.tracking} /></ConsentGate>
      </body>
    </html>
  );
}
