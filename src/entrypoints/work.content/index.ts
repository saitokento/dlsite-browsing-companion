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
  const name: string = extractName(doc);
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

function extractName(doc: Document): string {
  const name: string =
    doc
      .querySelector<HTMLElement>("#work_buy_box_wrapper > [data-work_name]")
      ?.getAttribute("data-work_name") ?? "";

  return name;
}

function extractPrice(doc: Document): number {
  const price: number = Number(
    doc
      .querySelector<HTMLElement>("#work_buy_box_wrapper > [data-price]")
      ?.getAttribute("data-price") || 0,
  );

  return price;
}

function extractOfficialPrice(doc: Document): number {
  const price: number = Number(
    doc
      .querySelector<HTMLElement>(
        "#work_buy_box_wrapper > [data-official_price]",
      )
      ?.getAttribute("data-official_price") || 0,
  );

  return price;
}

function extractCouponPrice(doc: Document): number | null {
  const priceElement = doc
    .querySelector<HTMLElement>(
      "#work_price .coupon_available .total .work_price_base",
    )
    ?.textContent?.replace(/,/g, "")
    .trim();

  if (!priceElement) return null;

  const price = Number(priceElement);
  return Number.isNaN(price) ? null : price;
}

function extractPriceAffixes(doc: Document): [string, string] {
  const prefix: string =
    doc
      .querySelector<HTMLElement>(
        "#work_price .work_buy_body .price .work_price_prefix",
      )
      ?.textContent.trim() ?? "";
  const suffix: string =
    doc
      .querySelector<HTMLElement>(
        "#work_price .work_buy_body .price .work_price_suffix",
      )
      ?.textContent.trim() ?? "";

  return [prefix, suffix];
}

function extractGenres(doc: Document): string[] {
  const genres: string[] = Array.from(
    doc.querySelectorAll<HTMLElement>("#work_outline .main_genre a"),
  )
    .map((a) => a.textContent?.trim() ?? "")
    .filter((genre) => genre !== "");

  return genres;
}

function extractDescription(doc: Document): string {
  const descriptionHtml: string =
    doc.querySelector<HTMLElement>(
      'div[itemprop="description"].work_parts_container',
    )?.innerHTML ?? "";

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
