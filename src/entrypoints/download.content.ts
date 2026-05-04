export default defineContentScript({
  matches: ["https://www.dlsite.com/*/download*"],
  main,
});

function main(): void {
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

function extractProductId(item: HTMLElement): string {
  return (
    item
      .querySelector<HTMLElement>(".work_name a")
      ?.getAttribute("href")
      ?.match(/\/product_id\/([A-Z]{2}\d+)\.html/i)?.[1] ?? ""
  );
}
