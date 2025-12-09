import { WorkInfo } from "@/utils/types";
import TurndownService from "turndown";
import { sendMessage } from "@/utils/messaging";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/work/=/product_id/*.html"],
  main() {
    let workInfo: WorkInfo;
    try {
      workInfo = fetchWorkInfo(document);
    } catch (err) {
      console.error("Failed to fetch workInfo:", err);
      return;
    }
    sendMessage("sendWorkInfo", workInfo).catch((err) => {
      console.error("Failed to send workInfo:", err);
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

/**
 * Collects work metadata and a Markdown description from the provided document.
 *
 * @param doc - The page Document to extract work information from
 * @returns A WorkInfo object containing:
 *  - `name`: work title
 *  - `price`: current numeric price
 *  - `officialPrice`: listed official numeric price
 *  - `couponPrice`: coupon-adjusted numeric price or `null` if not available
 *  - `pricePrefix`: text shown before the price
 *  - `priceSuffix`: text shown after the price
 *  - `genres`: array of genre names
 *  - `description`: work description converted to Markdown
 */
function fetchWorkInfo(doc: Document): WorkInfo {
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

/**
 * Extracts the listed price from the page's buy box.
 *
 * @returns The numeric listed price from the page; `0` if the price attribute is missing, or `NaN` if the attribute value is not a valid number.
 */
function fetchPrice(doc: Document): number {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-price]")
      ?.getAttribute("data-price") || 0,
  );

  return amount;
}

/**
 * Extracts the official price from the page's buy box.
 *
 * @returns The numeric value of the `data-official_price` attribute from `#work_buy_box_wrapper`, or `0` if the attribute is missing or cannot be parsed as a number.
 */
function fetchOfficialPrice(doc: Document): number {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-official_price]")
      ?.getAttribute("data-official_price") || 0,
  );

  return amount;
}

/**
 * Extracts the coupon price from the page when a coupon is available.
 *
 * @returns The coupon price as a number if present and parseable, `null` otherwise.
 */
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

/**
 * Extracts the price prefix and suffix strings from the document.
 *
 * @returns A tuple `[prefix, suffix]` where `prefix` is the text content of `.work_price_prefix` (empty string if missing) and `suffix` is the text content of `.work_price_suffix` (empty string if missing)
 */
function fetchPriceAffixes(doc: Document): [string, string] {
  const prefix: string =
    doc.querySelector(".work_price_prefix")?.textContent || "";
  const suffix: string =
    doc.querySelector(".work_price_suffix")?.textContent || "";

  return [prefix, suffix];
}

/**
 * Extracts the list of genre names from a DLsite work page.
 *
 * @param doc - The document to query for genre links.
 * @returns An array of trimmed genre names in document order; empty strings are omitted.
 */
function fetchGenres(doc: Document): string[] {
  const genres: string[] = Array.from(
    doc.querySelectorAll("#work_outline .main_genre a"),
  )
    .map((a) => a.textContent?.trim() || "")
    .filter((genre) => genre !== "");

  return genres;
}

/**
 * Convert the page's work description HTML into Markdown.
 *
 * @returns The work description as Markdown; an empty string if no description element is found.
 */
function fetchDescription(doc: Document): string {
  const descriptionHtml: string =
    doc.querySelector('[itemprop="description"].work_parts_container')
      ?.innerHTML || "";

  const description = turndownService.turndown(descriptionHtml);

  return description;
}