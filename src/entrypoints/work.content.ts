import TurndownService from "turndown";

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

function extractName(doc: Document): string {
  return (
    doc
      .querySelector<HTMLElement>("#work_buy_box_wrapper > [data-work_name]")
      ?.getAttribute("data-work_name") ?? ""
  );
}

function extractMakerName(doc: Document): string {
  return (
    doc.querySelector<HTMLElement>("#work_maker .maker_name a")?.textContent ??
    ""
  );
}

function extractPrice(doc: Document): string {
  return (
    doc
      .querySelector<HTMLElement>("#work_buy_box_wrapper > [data-price]")
      ?.getAttribute("data-price") || ""
  );
}

function extractOfficialPrice(doc: Document): string {
  return (
    doc
      .querySelector<HTMLElement>(
        "#work_buy_box_wrapper > [data-official_price]",
      )
      ?.getAttribute("data-official_price") || ""
  );
}

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

function extractGenres(doc: Document): string[] {
  return Array.from(
    doc.querySelectorAll<HTMLElement>("#work_outline .main_genre a"),
  )
    .map((a) => a.textContent?.trim() ?? "")
    .filter((genre) => genre !== "");
}

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

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});
