import TurndownService from "turndown";
import { loadAutoCommentEnabled, waitDomReady } from "@/utils/exports";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/work/=/product_id/*.html"],
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

/** 現在の作品ページから情報を抽出し、Backgroundへ送信する */
function commentTriggered(): void {
  let work: Work;
  try {
    work = extractWork(document);
  } catch (err) {
    console.error("Failed to extract work:", err);
    return;
  }
  sendMessage("work:extracted", work).catch((err) => {
    console.error("Failed to send 'work:extracted':", err);
  });
}

/**
 * 作品ページからコメント生成に必要な情報を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 抽出した作品情報
 */
function extractWork(doc: Document): Work {
  const name: string = extractName(doc);
  const makerName: string = extractMakerName(doc);
  const price: string = extractPrice(doc);
  const officialPrice: string = extractOfficialPrice(doc);
  const couponPrice: string | null = extractCouponPrice(doc);
  const [pricePrefix, priceSuffix]: string[] = extractPriceAffixes(doc);
  const genres: string[] = extractGenres(doc);
  const description: string = extractDescription(doc);

  return {
    name,
    makerName,
    price,
    officialPrice,
    couponPrice,
    pricePrefix,
    priceSuffix,
    genres,
    description,
  };
}

/**
 * 作品名を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 作品名。取得できない場合は空文字列
 */
function extractName(doc: Document): string {
  return (
    doc
      .querySelector<HTMLElement>("#work_buy_box_wrapper > [data-work_name]")
      ?.getAttribute("data-work_name") ?? ""
  );
}

/**
 * サークル名を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns サークル名。取得できない場合は空文字列
 */
function extractMakerName(doc: Document): string {
  return (
    doc.querySelector<HTMLElement>("#work_maker .maker_name a")?.textContent ??
    ""
  );
}

/**
 * 割引後の価格を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 割引後の価格。取得できない場合は空文字列
 */
function extractPrice(doc: Document): string {
  return (
    doc
      .querySelector<HTMLElement>("#work_buy_box_wrapper > [data-price]")
      ?.getAttribute("data-price") || ""
  );
}

/**
 * 割引前の価格を抽出します。
 * @param doc 抽出対象のドキュメント
 * @returns 割引前の価格。取得できない場合は空文字列
 */
function extractOfficialPrice(doc: Document): string {
  return (
    doc
      .querySelector<HTMLElement>(
        "#work_buy_box_wrapper > [data-official_price]",
      )
      ?.getAttribute("data-official_price") || ""
  );
}

/**
 * クーポン利用時の価格を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns クーポン利用価格。表示されていない場合は`null`
 */
function extractCouponPrice(doc: Document): string | null {
  const priceElement = doc
    .querySelector<HTMLElement>(
      "#work_price .coupon_available .total .work_price_base",
    )
    ?.textContent?.replace(/,/g, "")
    .trim();

  if (!priceElement) return null;

  return priceElement;
}

/**
 * 価格の接頭辞と接尾辞を返す（現在は円のみを返す）
 * @param _doc 抽出対象のドキュメント（現在は使用してない）
 * @returns 接頭辞と接尾辞の配列（現在は["", "円"]）
 */
function extractPriceAffixes(_doc: Document): [string, string] {
  // const prefix: string =
  //   doc
  //     .querySelector<HTMLElement>(
  //       "#work_price .work_buy_body .price .work_price_prefix",
  //     )
  //     ?.textContent?.trim() ?? "";
  // const suffix: string =
  //   doc
  //     .querySelector<HTMLElement>(
  //       "#work_price .work_buy_body .price .work_price_suffix",
  //     )
  //     ?.textContent?.trim() ?? "";

  // return [prefix, suffix];

  return ["", "円"];
}

/**
 * 作品のジャンル一覧を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns ジャンル名の一覧
 */
function extractGenres(doc: Document): string[] {
  return Array.from(
    doc.querySelectorAll<HTMLElement>("#work_outline .main_genre a"),
  )
    .map((a) => a.textContent?.trim() ?? "")
    .filter((genre) => genre !== "");
}

/**
 * 作品説明をMarkdown形式へ変換して抽出する
 * @param doc 抽出対象のドキュメント
 * @returns Markdown形式の作品説明。取得できない場合は空文字列
 */
function extractDescription(doc: Document): string {
  const descriptionElement = doc.querySelector<HTMLElement>(
    'div[itemprop="description"].work_parts_container',
  );

  if (!descriptionElement) return "";

  const template = doc.createElement("template");
  template.innerHTML = descriptionElement.innerHTML;

  normalizeUrls(template.content);

  const description = turndownService.turndown(template.innerHTML);

  return description;
}

/**
 * プロトコル相対URLをHTTPSの絶対URLに正規化する
 * @param root 正規化対象のDOMフラグメント
 */
function normalizeUrls(root: DocumentFragment): void {
  root
    .querySelectorAll<HTMLElement>('[href^="//"], [src^="//"]')
    .forEach((element) => {
      for (const attr of ["href", "src"] as const) {
        const value = element.getAttribute(attr);

        if (value?.startsWith("//")) {
          element.setAttribute(attr, `https:${value}`);
        }
      }
    });
}

/** HTMLをMarkdownに変換するためのTurndownインスタンス */
const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});
