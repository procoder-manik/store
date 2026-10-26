export type Section = { heading: string; body: string };
export type InfoDefault = { title: string; description: string; intro: string; sections: Section[]; faq?: { q: string; a: string }[] };

export const INFO_SLUGS = ["about", "contact", "faq", "shipping", "returns", "size-guide", "privacy", "terms"] as const;
export type InfoSlug = (typeof INFO_SLUGS)[number];
export const INFO_TITLES: Record<InfoSlug, string> = {
  about: "About us", contact: "Contact us", faq: "Questions and answers", shipping: "Delivery", returns: "Returns and exchanges",
  "size-guide": "Size guide", privacy: "Privacy policy", terms: "Terms of service",
};

/** Built-in text for the store pages. Create a page in Admin, Pages with the same address to replace any of them. */
export function infoDefault(slug: InfoSlug, brand: string, email: string): InfoDefault {
  const mail = email || "us through the Contact page";
  switch (slug) {
    case "about":
      return { title: "About us", description: `${brand} sells clothing, bedding and home decor in Bangladesh, with cash on delivery.`, intro: `${brand} is an online shop for clothing, bedding and home decor. We want shopping to be simple: see the real product, pick your color and size, and pay when it arrives.`, sections: [
        { heading: "What we sell", body: "T-shirts and hoodies for every day, bedsheets and covers for your bed, and decor and lighting for your home. Every product page shows the colors, sizes and what is in stock right now." },
        { heading: "How ordering works", body: "- Choose your product, color and size, then place your order.\n- We call to confirm it.\n- A courier brings it to your door.\n- You check the parcel and pay in cash, or you pay online before delivery if you prefer." },
        { heading: "We are here to help", body: `If you have a question about a product, an order or a delivery, reach out on the Contact page. We would rather answer a question before you order than fix a problem after.` },
      ] };
    case "faq":
      return { title: "Questions and answers", description: `Answers about ordering, delivery, payment and returns at ${brand}.`, intro: "The quick answers to what people ask us most.", sections: [], faq: [
        { q: "How do I place an order?", a: "Open a product, choose the color and size, add it to your cart and go to checkout. Fill in your name, mobile number and address, then place the order. You do not need an account." },
        { q: "How can I pay?", a: "Cash on delivery is available everywhere we deliver. If online payment is shown at checkout, you can also pay with bKash, Nagad, Rocket, a card or a bank account on a secure payment page." },
        { q: "Will someone confirm my order?", a: "Yes. We usually call the mobile number you gave to confirm your order and address before it is sent." },
        { q: "How much is delivery and how long does it take?", a: "The delivery fee for your area is shown at checkout before you pay. Delivery time depends on where you live. We tell you when we call to confirm your order." },
        { q: "Can I check the product before paying?", a: "With cash on delivery you receive the parcel and pay the courier. Please check that it is the right item before you pay." },
        { q: "How do I track my order?", a: "Use the Track your order page with your order number and mobile number. When your order ships we also add the courier and tracking number there and in your email." },
        { q: "Can I change or cancel my order?", a: "Contact us as soon as you can with your order number. We can usually change or cancel an order before it has been shipped." },
        { q: "What if the item is wrong, damaged or does not fit?", a: "Tell us right away and we will help. Read the Returns and exchanges page for how it works." },
        { q: "The color looks different from the photo. Why?", a: "Screens show colors a little differently. Each product lists its colors by name, and you can ask us any question before you order." },
        { q: "How do I contact you?", a: "Use the Contact page, call or message us on WhatsApp. Our details are on that page." },
      ] };
    case "shipping":
      return { title: "Delivery", description: `How ${brand} delivers your order, what it costs and how to track it.`, intro: "We deliver inside and outside Dhaka with trusted couriers.", sections: [
        { heading: "Delivery fee", body: "The fee depends on your area. Choose your area at checkout and you will see the exact fee before you place the order. Some orders may qualify for free delivery, and checkout shows this too." },
        { heading: "Confirmation and dispatch", body: "After you order, we confirm the details with you, then hand the parcel to a courier. You will get the courier name and a tracking number once it ships." },
        { heading: "Delivery time", body: "Delivery time depends on your location and the courier. We tell you the expected time when we confirm your order." },
        { heading: "When the parcel arrives", body: "- Keep your phone on so the courier can reach you.\n- Check that the parcel and the item match your order.\n- For cash on delivery, pay the amount on your order. The courier will ask for exactly the total shown on your invoice." },
        { heading: "Track your order", body: "Use the Track your order page with your order number and the mobile number you ordered with." },
      ] };
    case "returns":
      return { title: "Returns and exchanges", description: `What to do if an item from ${brand} is wrong, damaged or does not fit.`, intro: "If something is not right, tell us. We will work it out with you.", sections: [
        { heading: "When to contact us", body: "Contact us as soon as you notice a problem: the item is damaged, it is not what you ordered, or it does not fit and you would like to exchange it." },
        { heading: "What we need", body: "- Your order number and mobile number.\n- A short description of the problem, and photos if the item is damaged or wrong.\n- The item unused, in its original condition and packaging." },
        { heading: "What happens next", body: "We check the details and tell you the next steps, such as a replacement, an exchange for another size or color, or a refund. We confirm the outcome with you before anything is sent back." },
        { heading: "Refunds", body: "If a refund is agreed, we pay it back to you using the method we arrange with you, such as bKash or a bank transfer. If you paid online, the refund goes back through the payment provider." },
        { heading: "Items we cannot take back", body: "For hygiene reasons, items that have been used or washed cannot be returned unless they arrived faulty." },
      ] };
    case "size-guide":
      return { title: "Size guide", description: `How to measure yourself and pick the right size at ${brand}.`, intro: "Sizes differ a little between brands and cuts, so measure once and compare with the details on the product page.", sections: [
        { heading: "How to measure", body: "- Chest: around the fullest part of your chest, under your arms, keeping the tape level.\n- Waist: around your natural waist.\n- Length: from the top of the shoulder to where you want the item to end.\n- Measure over light clothing, and keep the tape snug but not tight." },
        { heading: "Choosing between two sizes", body: "Pick the larger size for a relaxed fit, or if you plan to wear layers. Pick the smaller size for a closer fit. Boxy and oversized items are cut wide on purpose, so many people choose their usual size or one size down." },
        { heading: "Bedding", body: "Check the bed size named on the product (Single, Double or King) and measure your mattress length, width and depth. If your mattress is deep, ask us before you order." },
        { heading: "Still not sure?", body: "Send us your height and usual size on the Contact page or WhatsApp and we will help you choose." },
      ] };
    case "privacy":
      return { title: "Privacy policy", description: `How ${brand} collects, uses and protects your personal information.`, intro: `This page explains what ${brand} collects when you shop with us and what we do with it.`, sections: [
        { heading: "What we collect", body: "- Your name, mobile number, delivery address and email, which you give us when you order or contact us.\n- Your order history.\n- If you create an account, your sign in details.\n- Basic visit information, such as pages viewed, if analytics is switched on for the store." },
        { heading: "How we use it", body: "To confirm and deliver your orders, to contact you about them, to answer your questions, to prevent fraud and to improve the store. We send marketing email only if you sign up for it, and every email has an unsubscribe link." },
        { heading: "Who we share it with", body: "- Couriers, who need your name, phone and address to deliver.\n- Payment providers, if you pay online. We never see or store your card details.\n- Our email, hosting and database services, which process data for us.\nWe do not sell your personal information." },
        { heading: "Cookies and saved items", body: "Your browser saves your cart, wishlist, theme and color choices on your own device. If the store uses analytics or advertising tools, they may set cookies. When a cookie banner is shown, they only start after you accept." },
        { heading: "Your choices", body: `You can ask us to correct or delete your information, or to stop marketing emails, by contacting ${mail}. We keep order records for as long as we need them for accounting and legal reasons.` },
        { heading: "Security", body: "We use secure connections, limit who can open the admin area and require a second step to sign in there. No online service is perfectly secure, so please keep your own passwords private." },
      ] };
    case "terms":
      return { title: "Terms of service", description: `The terms for shopping at ${brand}.`, intro: `By placing an order with ${brand} you agree to these terms. Please read them before you order.`, sections: [
        { heading: "Orders", body: "When you place an order we send you a confirmation and may call you to check the details. An order is accepted once we confirm it. We may decline or cancel an order, for example if an item is out of stock, a price was shown wrongly or we cannot reach you to confirm." },
        { heading: "Prices and stock", body: "All prices are in Bangladeshi taka and may change. The price you see when you place your order is the price you pay, plus the delivery fee shown at checkout. Stock levels are shown as accurately as we can, but items can sell out." },
        { heading: "Payment", body: "You can pay in cash when the parcel arrives, or online where that option is offered. Online payments are handled by a secure payment provider." },
        { heading: "Delivery", body: "We deliver to the address you give us. Please make sure it is complete and that someone can receive the parcel. Delivery times are estimates, not guarantees." },
        { heading: "Returns", body: "Our Returns and exchanges page explains what to do if an item is wrong, damaged or does not fit." },
        { heading: "Product information", body: "We try to describe and photograph products accurately. Colors can look different on different screens." },
        { heading: "Our responsibility", body: "We are responsible for supplying the items you ordered as described. We are not responsible for delays caused by couriers, weather or events outside our control, but we will help you follow up." },
        { heading: "Changes and law", body: "We may update these terms from time to time. The terms in force when you order apply to your order. These terms follow the laws of Bangladesh." },
      ] };
    case "contact":
      return { title: "Contact us", description: `Get in touch with ${brand}.`, intro: "Questions about a product, an order or a delivery? Send us a message and we will get back to you.", sections: [] };
  }
}
