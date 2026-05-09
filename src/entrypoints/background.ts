import { CharacterId } from "@/utils/types.ts";
import {
  CHARACTER_ID_KEY,
  DEBUG_MODE_KEY,
  isCharacterId,
} from "./options/App.tsx";
import { loadCommentGenerationEnabled } from "./popup/App.tsx";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL;

let isStreaming = false;

let characterId: CharacterId = "default";
let debugMode: boolean = false;

export default defineBackground(main);

function main(): void {
  if (typeof BACKEND_API_KEY !== "string" || BACKEND_API_KEY.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_API_KEY");
  }
  if (typeof BACKEND_URL !== "string" || BACKEND_URL.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_URL");
  }

  onMessage("work:extracted", handleWorkExtracted);
  onMessage("home:open", handleHomeOpen);
  onMessage("home:hello", handleHomeHello);
  onMessage("circle:new", handleCircleNew);
  onMessage("userbuy:open", handleUserbuyOpen);
  onMessage("userbuy:extracted", handleUserbuyExtracted);
  onMessage("cart:list", handleCartList);
  onMessage("download:list", handleDownloadList);
}

async function handleWorkExtracted(message: { data: Work }): Promise<void> {
  const work: Work = message.data;
  try {
    await generateComment("work", { work });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleHomeOpen(message: { data: Home }): Promise<void> {
  const home: Home = message.data;
  const targetTabId: number | undefined = await openDLsite(home);
  if (targetTabId) {
    await sendMessage("home:triggered", undefined, targetTabId).catch((err) => {
      console.error("Failed to send 'triggered':", err);
    });
  }
}

async function handleHomeHello(message: { data: string }): Promise<void> {
  const floor: string = message.data;
  try {
    await generateComment("home:hello", { floor });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleCircleNew(message: {
  data: CircleNewPayload;
}): Promise<void> {
  const circleNewPayload: CircleNewPayload = message.data;
  try {
    await generateComment("circle:new", circleNewPayload);
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleUserbuyOpen(): Promise<void> {
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!activeTab) {
    console.error("No active tab found.");
    return;
  }

  let targetTabId = activeTab.id;

  const userbuyUrl =
    "https://www.dlsite.com/home/mypage/userbuy/=/type/all/start/all/sort/1/order/1";

  const currentUrl = activeTab.url ? new URL(activeTab.url) : undefined;

  if (!currentUrl || !isUserbuyUrl(currentUrl)) {
    if (
      targetTabId !== undefined &&
      (activeTab.url === "chrome://newtab/" || activeTab.url === "about:newtab")
    ) {
      const updatedTab = await browser.tabs.update(targetTabId, {
        url: userbuyUrl,
        active: true,
      });

      targetTabId = updatedTab?.id;
    } else {
      const win = await browser.windows.getCurrent();

      const createdTab = await browser.tabs.create({
        windowId: win.id,
        url: userbuyUrl,
        active: true,
      });

      targetTabId = createdTab.id;
    }
  }

  if (targetTabId === undefined) {
    console.error("Failed to resolve target tab id.");
    return;
  }

  await waitForTabComplete(targetTabId);

  await sendMessage("userbuy:triggered", undefined, targetTabId).catch(
    (err) => {
      console.error("Failed to send 'userbuy:triggered':", err);
    },
  );
}

async function handleUserbuyExtracted(message: {
  data: UserbuyWork[];
}): Promise<void> {
  const userbuyWorkList: UserbuyWork[] = message.data;
  try {
    await generateComment("userbuy:page1", { userbuyWorkList });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleCartList(message: {
  data: CartListPayload;
}): Promise<void> {
  const cartListPayload: CartListPayload = message.data;
  try {
    await generateComment("cart:list", cartListPayload);
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleDownloadList(message: {
  data: DownloadListPayload;
}): Promise<void> {
  const downloadListPayload: DownloadListPayload = message.data;
  try {
    await generateComment("download:list", downloadListPayload);
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function openDLsite(home: Home): Promise<number | undefined> {
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!activeTab) {
    console.error("No active tab found.");
    return;
  }

  let targetTabId = activeTab.id;

  const dlsiteUrl = `https://www.dlsite.com${home.path}`;

  if (
    targetTabId !== undefined &&
    (activeTab.url === "chrome://newtab/" || activeTab.url === "about:newtab")
  ) {
    const updatedTab = await browser.tabs.update(targetTabId, {
      url: dlsiteUrl,
      active: true,
    });

    targetTabId = updatedTab?.id;
  } else {
    const win = await browser.windows.getCurrent();

    const createdTab = await browser.tabs.create({
      windowId: win.id,
      url: dlsiteUrl,
      active: true,
    });

    targetTabId = createdTab.id;
  }

  if (targetTabId === undefined) {
    console.error("Failed to resolve target tab id.");
    return;
  }

  await waitForTabComplete(targetTabId);

  return targetTabId;
}

async function generateComment<U extends Usecase>(
  usecase: U,
  payload: PayloadByUsecase[U],
): Promise<void> {
  const commentGenerationEnabled = await loadCommentGenerationEnabled();

  if (!commentGenerationEnabled) {
    console.log("Comment generation is disabled; skipping request.");
    return;
  }

  characterId =
    (await storage.getItem<CharacterId>(CHARACTER_ID_KEY)) ?? "default";
  debugMode = (await storage.getItem<boolean>(DEBUG_MODE_KEY)) ?? false;

  if (!isCharacterId(characterId)) {
    characterId = "default";
    console.error(
      "'local:characterId' in storage is invaild CharacterId. Falling back to 'default'",
    );
  }

  const body = JSON.stringify({
    characterId,
    usecase,
    payload: payload,
    debugMode,
  });

  if (isStreaming) {
    /* ストリーミングの重複防止 キューを実装するかは要検討 */
    console.log("Streaming already in progress; skipping new request.");
    return;
  }

  isStreaming = true;

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BACKEND_API_KEY,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Response status: ${response.status} ${response.statusText}`,
      );
    }

    if (response.body === null) {
      throw new Error(
        `Response body is null: ${response.status} ${response.statusText}`,
      );
    }

    const stream = response.body.pipeThrough(new TextDecoderStream());

    await sendMessage("comment:stream-start");

    for await (const chunk of stream) {
      await sendMessage("comment:stream-chunk", chunk);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(String(err));
    }
  } finally {
    isStreaming = false;
  }
}

function isUserbuyUrl(url: URL): boolean {
  try {
    return (
      url.protocol === "https:" &&
      url.hostname === "www.dlsite.com" &&
      /^\/[^/]+\/mypage\/userbuy(?:\/|$)/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

async function waitForTabComplete(tabId: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(listener);
      reject(new Error("Timed out waiting for tab to complete loading."));
    }, 30_000);

    const listener: Parameters<typeof browser.tabs.onUpdated.addListener>[0] = (
      updatedTabId: number,
      changeInfo: Browser.tabs.OnUpdatedInfo,
    ) => {
      if (updatedTabId !== tabId) {
        return;
      }

      if (changeInfo.status === "complete") {
        clearTimeout(timeoutId);
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    browser.tabs.onUpdated.addListener(listener);

    browser.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === "complete") {
          clearTimeout(timeoutId);
          browser.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        browser.tabs.onUpdated.removeListener(listener);
        reject(err);
      });
  });
}
