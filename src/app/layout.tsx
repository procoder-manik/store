import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { fontClasses } from "./fonts";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Tracking } from "@/components/Tracking";
import { ConsentGate } from "@/components/ConsentGate";
import { StoreOnly } from "@/components/StoreOnly";
import { isPalette } from "@/lib/palettes";
import { isTheme } from "@/lib/themes";
import { PromoPopup } from "@/components/PromoPopup";
import { SocialProof } from "@/components/SocialProof";
import { CompareBar } from "@/components/CompareBar";
import { ChatWidget } from "@/components/ChatWidget";
import { getCatalog } from "@/lib/catalog";
import { Suspense } from "react";
import { RefCapture } from "@/components/RefCapture";
import { ZonesProvider } from "@/components/ZonesProvider";
import { PaymentsProvider } from "@/components/PaymentsProvider";
import { availableMethods } from "@/lib/payments";
import { sslConfigured } from "@/lib/sslcommerz";
import { getZones } from "@/lib/zones";
import { getPublicSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  return {
    title: { default: s.brand.name, template: `%s | ${s.brand.name}` },
    description: s.brand.tagline,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/" },
    openGraph: { siteName: s.brand.name, locale: "en_BD", type: "website" },
    twitter: { card: "summary_large_image" },
    verification: s.tracking.gscToken ? { google: s.tracking.gscToken } : undefined,
  };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ categories }, s, zones] = await Promise.all([getCatalog(), getPublicSettings(), getZones()]);
  const a = s.announcement;
  const bar = "block bg-ink px-4 py-2 text-center text-xs text-paper";
  const methods = availableMethods(s.payments, { sslReady: sslConfigured() });
  return (
    <html lang="en" suppressHydrationWarning data-theme={isTheme(s.appearance.theme) ? s.appearance.theme : "studio"} data-buttons={s.appearance.buttons ?? "round"} {...(isPalette(s.appearance.accent) ? { "data-palette": s.appearance.accent } : {})} className={fontClasses}>
      <head>
        {s.appearance.visitorPicker && <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme-pick');if(t&&/^[a-z]{3,12}$/.test(t)){var e=document.documentElement;e.setAttribute('data-theme',t);e.removeAttribute('data-palette')}}catch(e){}" }} />}
      </head>
      <body>
        <Providers mode={s.appearance.mode}>
          <ZonesProvider zones={zones}>
          <PaymentsProvider methods={methods}>
          <Suspense fallback={null}><RefCapture /></Suspense>
          <StoreOnly>
            {a.enabled && a.text && (a.link ? <Link href={a.link} className={bar}>{a.text}</Link> : <div className={bar}>{a.text}</div>)}
            <Header brand={s.brand.name} logo={s.brand.logo} links={s.header.links} categories={categories} themePicker={s.appearance.visitorPicker} cfg={s.headerStyle} contact={{ phone: s.contact.phone, whatsapp: s.contact.whatsapp }} />
          </StoreOnly>
          {children}
          <StoreOnly><Footer categories={categories} brand={s.brand} footer={s.footer} contact={s.contact} cfg={s.footerStyle} payments={methods.map((m) => m.name)} /></StoreOnly>
          <CartDrawer />
          <PromoPopup p={s.popup} />
          <CompareBar />
          {s.chat.enabled && <ChatWidget name={s.chat.name} greeting={s.chat.greeting} />}
          {s.proof.mode !== "off" && <SocialProof />}
          </PaymentsProvider>
          </ZonesProvider>
        </Providers>
        <ConsentGate ask={s.tracking.consent && !!(s.tracking.fbPixel || s.tracking.ga4 || s.tracking.gtm)}><Tracking t={s.tracking} /></ConsentGate>
      </body>
    </html>
  );
}
