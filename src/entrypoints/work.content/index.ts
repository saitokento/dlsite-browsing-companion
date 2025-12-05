import { WorkInfo, Price } from "@/utils/types";
import TurndownService from "turndown";

export default defineContentScript({
  matches: ["https://www.dlsite.com/*/work/=/product_id/*.html"],
  main() {
    console.log(fetchWorkInfo(document));
  },
});

function fetchWorkInfo(doc: Document): WorkInfo {
  const name: string = doc.querySelector("#work_name")?.textContent || "";
  const price: Price = fetchPrice(doc);
  const coupon_price: Price | null = fetchCouponPrice(doc);
  const genres: string[] = fetchGenres(doc);
  const description: string = fetchDescription(doc);

  return {
    name,
    price,
    coupon_price,
    genres,
    description,
  };
}

function fetchPrice(doc: Document): Price {
  const amount: number = Number(
    doc
      .querySelector("#work_buy_box_wrapper [data-price]")
      ?.getAttribute("data-price") || 0,
  );

  const [prefix, suffix]: string[] = fetchPriceAffix(doc);

  return {
    prefix,
    amount,
    suffix,
  };
}

function fetchCouponPrice(doc: Document): Price | null {
  const amountElement = doc.querySelector(".coupon_available .work_price_base");
  const amount: number | null = amountElement?.textContent
    ? Number(amountElement.textContent)
    : null;

  if (amount == null) {
    return null;
  }

  const [prefix, suffix]: string[] = fetchPriceAffix(doc);

  return {
    prefix,
    amount,
    suffix,
  };
}

function fetchPriceAffix(doc: Document): string[] {
  const prefix: string =
    doc.querySelector(".work_price_prefix")?.textContent || "";
  const suffix: string =
    doc.querySelector(".work_price_suffix")?.textContent || "";

  return [prefix, suffix];
}

function fetchGenres(doc: Document): string[] {
  const genres: string[] = Array.from(
    doc.querySelectorAll("#work_outline .main_genre a"),
  ).map((a) => a.textContent?.trim() || "");

  return genres;
}

function fetchDescription(doc: Document): string {
  const descriptionHtml: string =
    doc.querySelector('[itemprop="description"].work_parts_container')
      ?.innerHTML || "";

  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  const description = turndownService.turndown(descriptionHtml);

  return description;
}
