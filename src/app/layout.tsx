import type { Metadata, Viewport } from "next";
import { fontClasses } from "./fonts";
import "./globals.css";
import "./glass.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Tracking } from "@/components/Tracking";
import { ConsentGate } from "@/components/ConsentGate";
import { StoreOnly } from "@/components/StoreOnly";
import { isPalette } from "@/lib/palettes";
import { CardStyle } from "@/components/CardStyle";
import { adminThemeCss, isCardStyle, isTheme, themeCss, themeOf, THEMES, withColors } from "@/lib/themes";
import { CartChip, MobileDock } from "@/components/MobileDock";
import { PromoPopup } from "@/components/PromoPopup";
import { SocialProof } from "@/components/SocialProof";
import { CompareBar } from "@/components/CompareBar";
import { ChatWidget } from "@/components/ChatWidget";
import { BackToTop } from "@/components/BackToTop";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { getCatalog } from "@/lib/catalog";
import { getBanners } from "@/lib/banners";
import { BannerPopup, OfferSlider } from "@/components/OfferSlider";
import { Suspense } from "react";
import { RefCapture } from "@/components/RefCapture";
import { RecoveryCatcher } from "@/components/RecoveryCatcher";
import { ZonesProvider } from "@/components/ZonesProvider";
import { PaymentsProvider } from "@/components/PaymentsProvider";
import { availableMethods } from "@/lib/payments";
import { sslConfigured } from "@/lib/sslcommerz";
import { ruleLive } from "@/lib/free-delivery";
import { showMenu } from "@/lib/mega-menu";
import { getZones } from "@/lib/zones";
import { couponDead } from "@/lib/offers";
import { getPublicSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  return {
    title: { default: s.brand.name, template: `%s | ${s.brand.name}` },
    description: s.brand.tagline,
    metadataBase: new URL(SITE_URL),
    openGraph: { siteName: s.brand.name, locale: "en_BD", type: "website" },
    twitter: { card: "summary_large_image" },
    verification: s.tracking.gscToken ? { google: s.tracking.gscToken } : undefined,
  };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f5f5f1" }, { media: "(prefers-color-scheme: dark)", color: "#0b1513" }] };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ categories, products }, s, zones, banners] = await Promise.all([getCatalog(), getPublicSettings(), getZones(), getBanners()]);
  const inSlot = (slot: string) => banners.filter((b) => b.slot === slot);
  const a = s.announcement;
  // The menu always lists the live categories first, then any extra links added in Admin, Site and menu.
  const categoryLinks = categories.map((c) => ({ label: c.label, href: `/category/${c.id}` }));
  const preorderLink = products.some((p) => p.preorder) ? [{ label: "Pre-order", href: "/pre-order" }] : [];
  const hasOffers = ruleLive(s.freeDelivery) || s.offers.coupons.length > 0 || banners.some((b) => b.title || b.image) || products.some((p) => (p.compareAt ?? 0) > p.basePrice);
  const autoLinks = [...categoryLinks, ...preorderLink, ...(hasOffers ? [{ label: "Offers", href: "/offers" }] : [])];
  const baseLinks = [...autoLinks, ...s.header.links.filter((l) => !autoLinks.some((c) => c.href === l.href))];
  // A mega menu can bring its own item to the top menu. Prices and products in it are read fresh with the page.
  const mega = s.mega.menus.filter((m) => m.enabled && m.columns.length > 0).map((m) => showMenu(m, products, categories));
  const menuLinks = [...baseLinks.map((l) => ({ ...l, label: mega.find((m) => m.href === l.href)?.label ?? l.label })), ...mega.filter((m) => !baseLinks.some((l) => l.href === m.href)).map((m) => ({ label: m.label, href: m.href }))];
  const methods = availableMethods(s.payments, { sslReady: await sslConfigured() });
  // Don't let the popup advertise a coupon customers can no longer use (switched off, expired or fully used).
  const popup = s.popup.enabled && s.popup.code && (await couponDead(s.popup.code)) ? { ...s.popup, enabled: false } : s.popup;
  const theme = themeOf(s.appearance.theme);
  // Only the store's own theme and the one the admin panel uses go into the page, unless visitors may switch.
  const dressed = (t: typeof theme) => withColors(t, s.appearance.colors[t.id]);
  const css = themeCss(s.appearance.visitorPicker ? THEMES.map(dressed) : theme.id === "padma" ? [dressed(theme)] : [THEMES[0], dressed(theme)]) + adminThemeCss();
  return (
    <html lang="en" suppressHydrationWarning data-theme={isTheme(s.appearance.theme) ? s.appearance.theme : "padma"} data-buttons={s.appearance.buttons ?? "theme"} data-grid={s.appearance.sectionGrid ? "on" : "off"} data-shine={s.appearance.shine ? "on" : "off"} data-glass={s.appearance.glass ? "on" : "off"} {...(isPalette(s.appearance.accent) ? { "data-palette": s.appearance.accent } : {})} className={fontClasses}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {s.appearance.visitorPicker && <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme-pick');if(t&&/^[a-z]{3,12}$/.test(t)){var e=document.documentElement;e.setAttribute('data-theme',t);e.removeAttribute('data-palette')}}catch(e){}" }} />}
      </head>
      <body>
        <Providers>
          <CardStyle value={isCardStyle(s.appearance.card) ? s.appearance.card : s.appearance.glass ? "ios" : theme.card}>
          <ZonesProvider zones={zones}>
          <PaymentsProvider methods={methods} advance={s.payments.advance}>
          <Suspense fallback={null}><RefCapture /></Suspense>
          <RecoveryCatcher />
          <StoreOnly>
            {inSlot("header").length > 0 ? <OfferSlider banners={inSlot("header")} size="strip" /> : a.enabled && a.text && <AnnouncementBar text={a.text} link={a.link} />}
            <Header mega={mega} brand={s.brand.name} logo={s.brand.logo} links={menuLinks} categories={categories} themePicker={s.appearance.visitorPicker} cfg={s.headerStyle} contact={{ phone: s.contact.phone, whatsapp: s.contact.whatsapp }} />
          </StoreOnly>
          {children}
          <StoreOnly><div className="footer-gap mt-16"><OfferSlider banners={inSlot("pre-footer")} size="band" /></div></StoreOnly>
          <StoreOnly><BannerPopup banners={inSlot("popup")} /></StoreOnly>
          <StoreOnly><Footer categories={categories} brand={s.brand} footer={s.footer} contact={s.contact} cfg={s.footerStyle} payments={methods.map((m) => m.name)} /></StoreOnly>
          <CartDrawer />
          {s.extras.quickBar && <StoreOnly><MobileDock links={menuLinks} /></StoreOnly>}
          {s.extras.cartChip && <StoreOnly><CartChip /></StoreOnly>}
          <PromoPopup p={popup} />
          <CompareBar />
          {s.extras.backToTop && <StoreOnly><BackToTop withText={s.extras.backToTopText} /></StoreOnly>}
          {s.chat.enabled && <ChatWidget name={s.chat.name} greeting={s.chat.greeting} avatar={s.chat.avatar || s.brand.logo} whatsapp={s.chat.waEnabled ? s.chat.waNumber || s.contact.whatsapp : ""} waNote={s.chat.waNote} />}
          {s.proof.mode !== "off" && <SocialProof />}
          </PaymentsProvider>
          </ZonesProvider>
          </CardStyle>
        </Providers>
        <ConsentGate ask={s.tracking.consent && !!(s.tracking.fbPixel || s.tracking.ga4 || s.tracking.gtm)}><Tracking t={s.tracking} /></ConsentGate>
      </body>
    </html>
  );
}
