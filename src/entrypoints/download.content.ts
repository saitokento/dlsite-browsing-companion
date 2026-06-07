import { loadAutoCommentEnabled, waitDomReady } from "@/utils/exports";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/download*"],
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

/** 購入作品ページから作品情報を抽出し、Backgroundへ送信する */
function commentTriggered(): void {
  let downloadWorkList: DownloadWork[];
  try {
    downloadWorkList = extractWorkList(document);
  } catch (err) {
    console.error("Failed to extract work list:", err);
    return;
  }
  sendMessage("download:list", { downloadWorkList }).catch((err) => {
    console.error("Failed to send 'download:list':", err);
  });
}

/**
 * 購入作品の表から作品情報を抽出する
 * @param doc 抽出対象のドキュメント
 * @returns 購入作品の一覧
 */
function extractWorkList(doc: Document): DownloadWork[] {
  const items = Array.from(
    doc.querySelectorAll<HTMLLIElement>("#download_work_list tr"),
  );

  return items
    .filter((item) => item.querySelector(".work_name"))
    .map((item): DownloadWork => {
      const productId = extractProductId(item);
      const name = item.querySelector(".work_name a")?.textContent ?? "";
      const makerName = item.querySelector(".maker_name a")?.textContent ?? "";
      const genre = item.querySelector(".work_genre span")?.textContent ?? "";

      return {
        productId,
        name,
        makerName,
        genre,
      };
    });
}

/**
 * 作品リンクからプロダクトIDを抽出する
 * @param item 対象の作品行
 * @returns プロダクトID。取得できない場合は空文字列
 */
function extractProductId(item: HTMLElement): string {
  return (
    item
      .querySelector<HTMLElement>(".work_name a")
      ?.getAttribute("href")
      ?.match(/\/product_id\/([A-Z]{2}\d+)\.html/i)?.[1] ?? ""
  );
}
