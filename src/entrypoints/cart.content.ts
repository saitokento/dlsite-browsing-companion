import { loadAutoCommentEnabled, waitDomReady } from "@/utils/exports";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/cart"],
  main,
});

async function main() {
  onMessage("popup:comment-triggered", commentTriggered);

  const autoCommentEnabled = await loadAutoCommentEnabled();

  if (autoCommentEnabled) {
    if (!(await waitDomReady(10_000))) return;
    commentTriggered();
  }
}

/** カートページから情報を抽出し、Backgroundへ送信する */
function commentTriggered(): void {
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

/**
 * カート内作品一覧、割引情報、クーポン情報を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns コメント生成用のカート情報
 */
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

/**
 * カート内の作品一覧を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns カート内作品の一覧
 */
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

/**
 * 割引後合計金額と通貨単位を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 合計金額、通貨接頭辞、通貨接尾辞の配列
 */
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

/**
 * 割引前の合計金額を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 割引前合計。表示がない場合は`null`
 */
function extractTotalOriginal(doc: Document): string | null {
  const totalOriginal = doc
    .querySelector(".total_original .work_price_base")
    ?.textContent?.replace(/,/g, "")
    .trim();

  if (!totalOriginal || totalOriginal == "") return null;

  return totalOriginal;
}

/**
 * 使用可能なクーポン名を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns クーポン名。表示がない場合は`null`
 */
function extractCouponName(doc: Document): string | null {
  const couponName = doc.querySelector(
    ".coupon_available_inner .coupon_name",
  )?.textContent;

  if (!couponName || couponName == "") return null;

  return couponName;
}

/**
 * クーポン適用後の合計金額を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns クーポン適用後合計。表示がない場合は`null`
 */
function extractTotalCoupon(doc: Document): string | null {
  const totalCoupon = doc
    .querySelector(".coupon_available_inner .work_price_base")
    ?.textContent?.replace(/,/g, "")
    .trim();

  if (!totalCoupon || totalCoupon == "") return null;

  return totalCoupon;
}
