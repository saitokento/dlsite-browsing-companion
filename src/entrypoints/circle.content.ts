export default defineContentScript({
  matches: ["https://www.dlsite.com/*/circle/profile/=/maker_id/*.html"],
  main,
});

function main(): void {
  let circleNewPayload: CircleNewPayload;
  try {
    circleNewPayload = extractCircle(document);
  } catch (err) {
    console.error("Failed to extract circle page:", err);
    return;
  }
  sendMessage("circle:new", circleNewPayload).catch((err) => {
    console.error("Failed to send 'circle:new':", err);
  });
}

function extractCircle(doc: Document): CircleNewPayload {
  const makerName =
    doc.querySelector<HTMLElement>(".prof_maker_name")?.textContent ?? "";
  const circleAnnounceWorkList = extractAnnounceWorkList(doc);
  const circleWorkList = extractWorkList(doc);

  return { makerName, circleAnnounceWorkList, circleWorkList };
}

function extractAnnounceWorkList(doc: Document): CircleAnnounceWork[] {
  return Array.from(
    doc.querySelectorAll<HTMLTableRowElement>(".prof_ana_work tr"),
  ).map((item): CircleAnnounceWork => {
    const productId = extractAnnounceProductId(item);
    const name = item.querySelector(".work_name > a")?.textContent ?? "";
    const author = extractAnnounceAuthor(item);
    const category = item.querySelector(".work_category a")?.textContent ?? "";
    const expectedDate = extractExpectedDate(item);
    const freeSample = extractFreeSample(item);

    return {
      productId,
      name,
      author,
      category,
      expectedDate,
      freeSample,
    };
  });
}

function extractAnnounceProductId(item: HTMLElement): string {
  return (
    item.querySelector<HTMLElement>("[data-product_id]")?.dataset.product_id ??
    ""
  );
}

function extractAnnounceAuthor(item: HTMLElement): string | null {
  const authorElement = item.querySelector<HTMLElement>(".author");

  return authorElement
    ? `${authorElement?.textContent ?? ""}${authorElement.classList.contains("omit") ? " 他" : ""}`
    : null;
}

function extractExpectedDate(item: HTMLElement): string {
  return item.querySelector(".expected_date")?.textContent?.trim() ?? "";
}

function extractFreeSample(item: HTMLElement): boolean {
  const freeSampleButton = item.querySelector<HTMLElement>(".btn_free_sample");

  if (!freeSampleButton) {
    return false;
  }

  return !freeSampleButton.classList.contains("disabled");
}

function extractWorkList(doc: Document): CircleWork[] {
  const items = Array.from(
    doc.querySelectorAll<HTMLLIElement>(
      "#search_result_img_box > li[data-list_item_product_id]",
    ),
  );

  return items.map((item): CircleWork => {
    const productId = item.dataset.list_item_product_id ?? "";
    const category = item.querySelector(".work_category a")?.textContent ?? "";
    const name = item.querySelector(".work_name a")?.textContent ?? "";
    const author = extractAuthor(item);
    const price = extractPrice(item);
    const officialPrice = extractOfficialPrice(item);
    const [pricePrefix, priceSuffix]: string[] = extractPriceAffixes(item);
    const labels = extractLabels(item);

    return {
      productId,
      category,
      name,
      author,
      price,
      officialPrice,
      pricePrefix,
      priceSuffix,
      labels,
    };
  });
}

function extractAuthor(item: HTMLElement): string | null {
  const authorElement = item.querySelector(".author");
  return authorElement
    ? `${authorElement?.textContent ?? ""}${authorElement.classList.contains("omit") ? " 他" : ""}`
    : null;
}

function extractPrice(item: HTMLElement): string {
  return (
    item.querySelector<HTMLElement>("[data-price]")?.dataset.price ??
    item
      .querySelector<HTMLElement>(".work_price_base")
      ?.textContent?.replace(/,/g, "") ??
    ""
  );
}

function extractOfficialPrice(item: HTMLElement): string {
  return (
    item.querySelector<HTMLElement>("[data-official_price]")?.dataset
      .official_price ??
    item
      .querySelector<HTMLElement>(".strike .work_price_base")
      ?.textContent?.replace(/,/g, "") ??
    ""
  );
}

function extractPriceAffixes(_item: HTMLElement): string[] {
  // const prefix = item.querySelector(".work_price_prefix")?.textContent ?? "";
  // const suffix = item.querySelector(".work_price_suffix")?.textContent ?? "";
  // return [prefix, suffix];

  return ["", "円"];
}

function extractLabels(item: HTMLElement): string[] {
  return Array.from(
    item.querySelectorAll<HTMLElement>(".work_deals.work_labels > *"),
  )
    .map((el) => el.textContent)
    .filter((label): label is string => label !== null && label.length > 0);
}
