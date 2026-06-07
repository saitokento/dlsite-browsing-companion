import { waitDomReady } from "@/utils/exports";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/mypage/userbuy*"],
  main,
});

function main(): void {
  onMessage("userbuy:triggered", handleUserbuyTriggered);
  onMessage("popup:comment-triggered", handleUserbuyTriggered);

  sendMessage("userbuy:ready", undefined).catch((err) => {
    console.error("Failed to send 'userbuy:ready':", err);
  });
}

/** 購入履歴ページから作品一覧を抽出し、バックグラウンドへ送信する */
async function handleUserbuyTriggered(): Promise<void> {
  let userbuyWorkList: UserbuyWork[];
  if (!(await waitDomReady(10_000))) return;
  try {
    userbuyWorkList = extractWorkList(document);
  } catch (err) {
    console.error("Failed to extract work list:", err);
    return;
  }
  await sendMessage("userbuy:extracted", userbuyWorkList).catch((err) => {
    console.error("Failed to send 'userbuy:extracted':", err);
  });
}

/**
 * 購入履歴の表から作品情報の一覧を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 購入済み作品の一覧
 */
function extractWorkList(doc: Document): UserbuyWork[] {
  const items = Array.from(
    doc.querySelectorAll<HTMLLIElement>(
      "#buy_history_this table.work_list_main tr",
    ),
  );

  return items
    .filter((item) => item.querySelector("td.buy_date"))
    .map((item): UserbuyWork => {
      const productId = extractProductId(item);
      const buyDate = item.querySelector("td.buy_date")?.textContent ?? "";
      const name = item.querySelector(".work_name a")?.textContent ?? "";
      const makerName = item.querySelector(".maker_name a")?.textContent ?? "";
      const genres = extractGenres(item);
      const [price, pricePrefix, priceSuffix] = extractPriceText(item);

      return {
        productId,
        buyDate,
        name,
        makerName,
        genres,
        price,
        pricePrefix,
        priceSuffix,
      };
    });
}

/**
 * 購入履歴行からプロダクトIDを抽出する
 * @param item 対象の購入履歴行
 * @returns プロダクトID。取得できない場合は空文字列
 */
function extractProductId(item: HTMLElement): string {
  return (
    item
      .querySelector<HTMLElement>('[id^="_link_"]')
      ?.id.replace(/^_link_/, "") ?? ""
  );
}

/**
 * 購入履歴行から作品カテゴリ一覧を抽出する
 * @param item 対象の購入履歴行
 * @returns 作品カテゴリの一覧
 */
function extractGenres(item: HTMLElement): string[] {
  return Array.from(item.querySelectorAll<HTMLElement>(".work_genre span"))
    .map((span) => span.textContent || "")
    .filter(Boolean);
}

/**
 * 購入履歴行から価格の数値部分と通貨の接頭辞・接尾辞（現在は円のみ）を返す
 * @param item 対象の購入履歴行
 * @returns 価格、接頭辞・接尾辞（現在は["", "円"]）の配列
 */
function extractPriceText(item: HTMLElement): string[] {
  const priceText =
    Array.from(item.querySelector("td.work_price")?.childNodes ?? [])
      .find((node) => node.nodeType === Node.TEXT_NODE)
      ?.textContent?.trim()
      .replace(/,/g, "") ?? "";

  const priceMatch = priceText.match(/^([^\d]*)(\d+)([^\d]*)$/);

  const price = priceMatch?.[2]?.trim() ?? "";
  // const pricePrefix = priceMatch?.[1]?.trim() ?? "";
  // const priceSuffix = priceMatch?.[3]?.trim() ?? "";

  return [price, "", "円"];
}
