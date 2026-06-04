import {
  CharacterId,
  CommentStreamEvent,
  CommentHistoryItem,
  CurrentComment,
} from "@/utils/types.ts";
import {
  CHARACTER_ID_KEY,
  isCharacterId,
  pruneExpiredCommentHistory,
} from "@/utils/exports";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL;

let isStreaming = false;

let characterId: CharacterId = "default";

export default defineBackground(main);

function main(): void {
  if (typeof BACKEND_API_KEY !== "string" || BACKEND_API_KEY.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_API_KEY");
  }
  if (typeof BACKEND_URL !== "string" || BACKEND_URL.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_URL");
  }

  onMessage("popup:wait-dom-ready", handlePopupWaitDomReady);
  onMessage("content:wait-dom-ready", handleContentWaitDomReady);
  onMessage("work:extracted", handleWorkExtracted);
  onMessage("home:open", handleHomeOpen);
  onMessage("home:hello", handleHomeHello);
  onMessage("circle:new", handleCircleNew);
  onMessage("userbuy:open", handleUserbuyOpen);
  onMessage("userbuy:extracted", handleUserbuyExtracted);
  onMessage("cart:list", handleCartList);
  onMessage("download:list", handleDownloadList);
}

async function handlePopupWaitDomReady({
  data,
}: {
  data: {
    tabId: number;
    timeoutMs?: number;
  };
}): Promise<boolean> {
  return waitUntilDomReady(data.tabId, data.timeoutMs);
}

async function handleContentWaitDomReady({
  data,
  sender,
}: {
  data: { timeoutMs?: number };
  sender: Browser.runtime.MessageSender;
}): Promise<boolean> {
  const tabId = sender.tab?.id;

  if (tabId === undefined) {
    return false;
  }

  return waitUntilDomReady(tabId, data.timeoutMs);
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
  if (targetTabId !== undefined) {
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
  const targetTabId: number | undefined = await openUserbuy();
  if (targetTabId !== undefined) {
    await sendMessage("userbuy:triggered", undefined, targetTabId).catch(
      (err) => {
        console.error("Failed to send 'userbuy:triggered':", err);
      },
    );
  }
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

async function waitUntilDomReady(
  tabId: number,
  timeoutMs = 10_000,
): Promise<boolean> {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      args: [timeoutMs],
      func: (timeoutMs: number) => {
        return new Promise<boolean>((resolve) => {
          if (document.readyState !== "loading") {
            resolve(true);
            return;
          }

          const timeoutId = window.setTimeout(() => {
            resolve(false);
          }, timeoutMs);

          document.addEventListener(
            "DOMContentLoaded",
            () => {
              window.clearTimeout(timeoutId);
              resolve(true);
            },
            { once: true },
          );
        });
      },
    });

    return Boolean(results[0]?.result);
  } catch (err) {
    console.error("Failed to wait until DOM ready:", err);
    return false;
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

async function openUserbuy(): Promise<number | undefined> {
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

  return targetTabId;
}

async function generateComment<U extends Usecase>(
  usecase: U,
  payload: PayloadByUsecase[U],
): Promise<void> {
  characterId =
    (await storage.getItem<CharacterId>(CHARACTER_ID_KEY)) ?? "default";

  if (!isCharacterId(characterId)) {
    characterId = "default";
    console.error(
      "'local:characterId' in storage is invaild CharacterId. Falling back to 'default'",
    );
  }

  const previousResponseIdKey: `local:${string}` = `local:xaiPreviousResponseId:${characterId}`;
  const commentHistoryKey: `local:${string}` = `local:commentHistory:${characterId}`;

  const previousResponseId = await storage.getItem<string>(
    previousResponseIdKey,
  );

  const body = JSON.stringify({
    characterId,
    usecase,
    payload: payload,
    ...(previousResponseId ? { previousResponseId } : {}),
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

    const currentComment: CurrentComment = {
      text: "",
      createdAt: new Date().toISOString(),
    };

    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk;

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        await handleCommentStreamLine(
          line,
          previousResponseIdKey,
          commentHistoryKey,
          currentComment,
        );

        newlineIndex = buffer.indexOf("\n");
      }
    }

    if (buffer.trim().length > 0) {
      await handleCommentStreamLine(
        buffer,
        previousResponseIdKey,
        commentHistoryKey,
        currentComment,
      );
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

async function handleCommentStreamLine(
  line: string,
  previousResponseIdKey: `local:${string}`,
  commentHistoryKey: `local:${string}`,
  currentComment: CurrentComment,
): Promise<void> {
  const trimmedLine = line.trim();

  if (trimmedLine.length === 0) {
    return;
  }

  let event: unknown;
  try {
    event = JSON.parse(trimmedLine);
  } catch (err) {
    console.error("Failed to parse comment stream line:", trimmedLine, err);
    return;
  }

  if (!isCommentStreamEvent(event)) {
    console.error("Unknown comment stream event:", event);
    return;
  }

  if (event.type === "delta") {
    currentComment.text += event.text;
    await sendMessage("comment:stream-chunk", event.text);
    return;
  }

  if (event.type === "done") {
    await storage.setItem(previousResponseIdKey, event.responseId);
    await appendCommentToHistoryInStorage(commentHistoryKey, currentComment);
    return;
  }
}

function isCommentStreamEvent(value: unknown): value is CommentStreamEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;

  if (event.type === "delta") {
    return typeof event.text === "string";
  }

  if (event.type === "done") {
    return typeof event.responseId === "string";
  }

  return false;
}

async function getCommentHistory(
  commentHistoryKey: `local:${string}`,
): Promise<CommentHistoryItem[]> {
  const commentHistory =
    (await storage.getItem<CommentHistoryItem[]>(commentHistoryKey)) ?? [];
  const prunedCommentHistory: CommentHistoryItem[] =
    pruneExpiredCommentHistory(commentHistory);

  if (prunedCommentHistory.length !== commentHistory.length) {
    await storage.setItem(commentHistoryKey, prunedCommentHistory);
  }

  return prunedCommentHistory;
}

async function setCommentHistory(
  commentHistoryKey: `local:${string}`,
  commentHistory: CommentHistoryItem[],
): Promise<void> {
  await storage.setItem(
    commentHistoryKey,
    pruneExpiredCommentHistory(commentHistory),
  );
}

async function appendCommentToHistoryInStorage(
  commentHistoryKey: `local:${string}`,
  comment: CurrentComment,
): Promise<void> {
  const text = comment.text.trim();

  if (text.length === 0) {
    return;
  }

  const commentHistory = await getCommentHistory(commentHistoryKey);

  await setCommentHistory(commentHistoryKey, [
    ...commentHistory,
    {
      text: comment.text,
      createdAt: comment.createdAt,
    },
  ]);
}
