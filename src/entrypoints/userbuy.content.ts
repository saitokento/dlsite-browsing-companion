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

function extractProductId(item: HTMLElement): string {
  return (
    item
      .querySelector<HTMLElement>('[id^="_link_"]')
      ?.id.replace(/^_link_/, "") ?? ""
  );
}

function extractGenres(item: HTMLElement): string[] {
  return Array.from(item.querySelectorAll<HTMLElement>(".work_genre span"))
    .map((span) => span.textContent || "")
    .filter(Boolean);
}

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
