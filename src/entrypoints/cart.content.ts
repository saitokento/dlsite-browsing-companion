import { CartWork, CartListPayload } from "@/utils/types";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/cart"],
  main,
});

function main(): void {
  let cartListPayload: CartListPayload;

  try {
    cartListPayload = extractCart(document);
  } catch (err) {
    console.error("Failed to extract cart:", err);
    return;
  }

  sendMessage("cart:list", cartListPayload).catch((err) => {
    console.error("Failed to send 'cart:list':", err);
  });
}

function extractCart(doc: Document): CartListPayload {
  const cartWorkList = extractWorkList(doc);
  const [totalDiscount, pricePrefix, priceSuffix] = extractTotalDiscount(doc);
  const totalOriginal = extractTotalOriginal(doc);
  const couponName = extractCouponName(doc);
  const totalCoupon = extractTotalCoupon(doc);

  return {
    cartWorkList,
    totalDiscount,
    totalOriginal,
    couponName,
    totalCoupon,
    pricePrefix,
    priceSuffix,
  };
}

function extractWorkList(doc: Document): CartWork[] {
  const items = Array.from(
    doc.querySelectorAll<HTMLLIElement>(
      "#cart_wrapper.buy_now li.cart_list_item.__cart_list_item",
    ),
  );

  return items.map((item): CartWork => {
    const productId = item.getAttribute("data-product-id") ?? "";
    const name =
      item.querySelector(".work_content .work_name a")?.textContent?.trim() ??
      "";
    const makerName =
      item.querySelector(".work_content .maker_name a")?.textContent ?? "";
    const category =
      item.querySelector(".work_thumb .work_category")?.textContent ?? "";
    const price = item.getAttribute("data-price") ?? "";
    const officialPrice = item.getAttribute("data-official_price") ?? "";
    return {
      productId,
      name,
      makerName,
      category,
      price,
      officialPrice,
    };
  });
}

function extractTotalDiscount(doc: Document): string[] {
  const totalDiscount =
    doc
      .querySelector(".total_discount .work_price_base")
      ?.textContent?.replace(/,/g, "")
      .trim() ?? "";
  // const prefix =
  //   doc.querySelector(".total_discount .work_price_prefix")?.textContent ?? "";
  // const suffix =
  //   doc.querySelector(".total_discount .work_price_suffix")?.textContent ?? "";

  return [totalDiscount, "", "円"];
}

function extractTotalOriginal(doc: Document): string | null {
  const totalOriginal = doc
    .querySelector(".total_original .work_price_base")
    ?.textContent?.replace(/,/g, "")
    .trim();

  if (!totalOriginal || totalOriginal == "") return null;

  return totalOriginal;
}

function extractCouponName(doc: Document): string | null {
  const couponName = doc.querySelector(
    ".coupon_available_inner .coupon_name",
  )?.textContent;

  if (!couponName || couponName == "") return null;

  return couponName;
}

function extractTotalCoupon(doc: Document): string | null {
  const totalCoupon = doc
    .querySelector(".coupon_available_inner .work_price_base")
    ?.textContent?.replace(/,/g, "")
    .trim();

  if (!totalCoupon || totalCoupon == "") return null;

  return totalCoupon;
}
