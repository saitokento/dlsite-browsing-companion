import { loadAutoCommentEnabled, waitDomReady } from "@/utils/exports";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/circle/profile/=/maker_id/*.html"],
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

/** 現在のサークルページから情報を抽出し、Backgroundへ送信する */
function commentTriggered(): void {
  let circleNewPayload: CircleNewPayload;
  try {
    circleNewPayload = extractCircle(document);
  } catch (err) {
    console.error("Failed to extract circle page:", err);
    return;
  }
  sendMessage("circle:new", circleNewPayload).catch((err) => {
    console.error("Failed to send 'circle:new':", err);
  });
}

/**
 * サークルページからメーカー名、予告作品一覧、販売作品一覧を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns コメント生成用のサークル情報
 */
function extractCircle(doc: Document): CircleNewPayload {
  const makerName =
    doc.querySelector<HTMLElement>(".prof_maker_name")?.textContent ?? "";
  const circleAnnounceWorkList = extractAnnounceWorkList(doc);
  const circleWorkList = extractWorkList(doc);

  return { makerName, circleAnnounceWorkList, circleWorkList };
}

/**
 * サークルページから予告作品一覧を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 予告作品の一覧
 */
function extractAnnounceWorkList(doc: Document): CircleAnnounceWork[] {
  return Array.from(
    doc.querySelectorAll<HTMLTableRowElement>(".prof_ana_work tr"),
  ).map((item): CircleAnnounceWork => {
    const productId = extractAnnounceProductId(item);
    const name = item.querySelector(".work_name > a")?.textContent ?? "";
    const author = extractAnnounceAuthor(item);
    const category = item.querySelector(".work_category a")?.textContent ?? "";
    const expectedDate = extractExpectedDate(item);
    const freeSample = extractFreeSample(item);

    return {
      productId,
      name,
      author,
      category,
      expectedDate,
      freeSample,
    };
  });
}

/**
 * 予告作品の要素から商品IDを抽出する
 * @param item 対象の予告作品の要素
 * @returns 商品ID。取得できない場合は空文字列
 */
function extractAnnounceProductId(item: HTMLElement): string {
  return (
    item.querySelector<HTMLElement>("[data-product_id]")?.dataset.product_id ??
    ""
  );
}

/**
 * 予告作品要素からクリエイター（シナリオ、イラスト、声優など）名を抽出する
 * @param item 対象の予告作品の要素
 * @returns クリエイター名。表示がない場合は`null`
 */
function extractAnnounceAuthor(item: HTMLElement): string | null {
  const authorElement = item.querySelector<HTMLElement>(".author");

  return authorElement
    ? `${authorElement?.textContent ?? ""}${authorElement.classList.contains("omit") ? " 他" : ""}`
    : null;
}

/**
 * 予告作品要素から販売予定日を抽出する
 * @param item 対象の予告作品の要素
 * @returns 販売予定日。取得できない場合は空文字列
 */
function extractExpectedDate(item: HTMLElement): string {
  return item.querySelector(".expected_date")?.textContent?.trim() ?? "";
}

/**
 * 予告作品の無料サンプルの有無を判定する
 * @param item 対象の予告作品の要素
 * @returns 無料サンプルがある場合は`true`
 */
function extractFreeSample(item: HTMLElement): boolean {
  const freeSampleButton = item.querySelector<HTMLElement>(".btn_free_sample");

  if (!freeSampleButton) {
    return false;
  }

  return !freeSampleButton.classList.contains("disabled");
}

/**
 * サークルページから販売中の作品一覧を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 販売中の作品一覧
 */
function extractWorkList(doc: Document): CircleWork[] {
  const items = Array.from(
    doc.querySelectorAll<HTMLLIElement>(
      "#search_result_img_box > li[data-list_item_product_id]",
    ),
  );

  return items.map((item): CircleWork => {
    const productId = item.dataset.list_item_product_id ?? "";
    const category = item.querySelector(".work_category a")?.textContent ?? "";
    const name = item.querySelector(".work_name a")?.textContent ?? "";
    const author = extractAuthor(item);
    const price = extractPrice(item);
    const officialPrice = extractOfficialPrice(item);
    const [pricePrefix, priceSuffix]: string[] = extractPriceAffixes(item);
    const labels = extractLabels(item);

    return {
      productId,
      category,
      name,
      author,
      price,
      officialPrice,
      pricePrefix,
      priceSuffix,
      labels,
    };
  });
}

/**
 * 作品要素からクリエイター（シナリオ、イラスト、声優など）名を抽出する
 * @param item 対象の作品の要素。
 * @returns クリエイター名。表示がない場合は`null`
 */
function extractAuthor(item: HTMLElement): string | null {
  const authorElement = item.querySelector(".author");
  return authorElement
    ? `${authorElement?.textContent ?? ""}${authorElement.classList.contains("omit") ? " 他" : ""}`
    : null;
}

/**
 * 作品要素から割引後価格を抽出する
 * @param item 対象の作品の要素
 * @returns 割引後価格。取得できない場合は空文字列
 */
function extractPrice(item: HTMLElement): string {
  return (
    item.querySelector<HTMLElement>("[data-price]")?.dataset.price ??
    item
      .querySelector<HTMLElement>(".work_price_base")
      ?.textContent?.replace(/,/g, "") ??
    ""
  );
}

/**
 * 作品要素から割引前価格を抽出する
 * @param item 対象の作品要素
 * @returns 割引前価格。取得できない場合は空文字列
 */
function extractOfficialPrice(item: HTMLElement): string {
  return (
    item.querySelector<HTMLElement>("[data-official_price]")?.dataset
      .official_price ??
    item
      .querySelector<HTMLElement>(".strike .work_price_base")
      ?.textContent?.replace(/,/g, "") ??
    ""
  );
}

/**
 * 価格の接頭辞と接尾辞を返す（現在は円のみを返す）
 * @param _item 対象の作品要素（現在は使用してない）
 * @returns 接頭辞と接尾辞の配列（現在は["", "円"]）
 */
function extractPriceAffixes(_item: HTMLElement): string[] {
  // const prefix = item.querySelector(".work_price_prefix")?.textContent ?? "";
  // const suffix = item.querySelector(".work_price_suffix")?.textContent ?? "";
  // return [prefix, suffix];

  return ["", "円"];
}

/**
 * 作品要素からラベル（割引率等）一覧を抽出する
 * @param item 対象の作品要素
 * @returns ラベル文字列の一覧
 */
function extractLabels(item: HTMLElement): string[] {
  return Array.from(
    item.querySelectorAll<HTMLElement>(".work_deals.work_labels > *"),
  )
    .map((el) => el.textContent)
    .filter((label): label is string => label !== null && label.length > 0);
}
