import { Work } from "@/utils/types";
import TurndownService from "turndown";
import { sendMessage } from "@/utils/messaging";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/work/=/product_id/*.html"],
  main,
});

function main(): void {
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

function extractWork(doc: Document): Work {
  const name: string = doc.querySelector("#work_name")?.textContent || "";
  const price: number = extractPrice(doc);
  const officialPrice: number = extractOfficialPrice(doc);
  const couponPrice: number | null = extractCouponPrice(doc);
  const [pricePrefix, priceSuffix]: string[] = extractPriceAffixes(doc);
  const genres: string[] = extractGenres(doc);
  const description: string = extractDescription(doc);

  return {
    name,
    price,
    officialPrice,
    couponPrice,
    pricePrefix,
    priceSuffix,
    genres,
    description,
  };
}

function extractPrice(doc: Document): number {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-price]")
      ?.getAttribute("data-price") || 0,
  );

  return amount;
}

function extractOfficialPrice(doc: Document): number {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-official_price]")
      ?.getAttribute("data-official_price") || 0,
  );

  return amount;
}

function extractCouponPrice(doc: Document): number | null {
  const amountElement = doc.querySelector(".coupon_available .work_price_base");
  const amount: number | null = amountElement?.textContent
    ? Number(amountElement.textContent.replace(/,/g, ""))
    : null;

  if (amount == null || isNaN(amount)) {
    return null;
  }

  return amount;
}

function extractPriceAffixes(doc: Document): [string, string] {
  const prefix: string =
    doc.querySelector(".work_price_prefix")?.textContent || "";
  const suffix: string =
    doc.querySelector(".work_price_suffix")?.textContent || "";

  return [prefix, suffix];
}

function extractGenres(doc: Document): string[] {
  const genres: string[] = Array.from(
    doc.querySelectorAll("#work_outline .main_genre a"),
  )
    .map((a) => a.textContent?.trim() || "")
    .filter((genre) => genre !== "");

  return genres;
}

function extractDescription(doc: Document): string {
  const descriptionHtml: string =
    doc.querySelector('[itemprop="description"].work_parts_container')
      ?.innerHTML || "";

  const description = turndownService.turndown(descriptionHtml);

  return description;
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});
