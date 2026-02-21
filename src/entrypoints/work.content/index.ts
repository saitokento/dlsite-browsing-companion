import { Work } from "@/utils/types";
import TurndownService from "turndown";
import { sendMessage } from "@/utils/messaging";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/work/=/product_id/*.html"],
  main() {
    let work: Work;
    try {
      work = fetchWork(document);
    } catch (err) {
      console.error("Failed to fetch work:", err);
      return;
    }
    sendMessage("work:extracted", work).catch((err) => {
      console.error("Failed to send work:", err);
    });
  },
});

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});

function fetchWork(doc: Document): Work {
  const name: string = doc.querySelector("#work_name")?.textContent || "";
  const price: number = fetchPrice(doc);
  const officialPrice: number = fetchOfficialPrice(doc);
  const couponPrice: number | null = fetchCouponPrice(doc);
  const [pricePrefix, priceSuffix]: string[] = fetchPriceAffixes(doc);
  const genres: string[] = fetchGenres(doc);
  const description: string = fetchDescription(doc);

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

function fetchPrice(doc: Document): number {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-price]")
      ?.getAttribute("data-price") || 0,
  );

  return amount;
}

function fetchOfficialPrice(doc: Document): number {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-official_price]")
      ?.getAttribute("data-official_price") || 0,
  );

  return amount;
}

function fetchCouponPrice(doc: Document): number | null {
  const amountElement = doc.querySelector(".coupon_available .work_price_base");
  const amount: number | null = amountElement?.textContent
    ? Number(amountElement.textContent.replace(/,/g, ""))
    : null;

  if (amount == null || isNaN(amount)) {
    return null;
  }

  return amount;
}

function fetchPriceAffixes(doc: Document): [string, string] {
  const prefix: string =
    doc.querySelector(".work_price_prefix")?.textContent || "";
  const suffix: string =
    doc.querySelector(".work_price_suffix")?.textContent || "";

  return [prefix, suffix];
}

function fetchGenres(doc: Document): string[] {
  const genres: string[] = Array.from(
    doc.querySelectorAll("#work_outline .main_genre a"),
  )
    .map((a) => a.textContent?.trim() || "")
    .filter((genre) => genre !== "");

  return genres;
}

function fetchDescription(doc: Document): string {
  const descriptionHtml: string =
    doc.querySelector('[itemprop="description"].work_parts_container')
      ?.innerHTML || "";

  const description = turndownService.turndown(descriptionHtml);

  return description;
}
