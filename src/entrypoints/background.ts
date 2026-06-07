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

const pendingHomeTabIds = new Set<number>();
const readyHomeTabIds = new Set<number>();

const pendingUserbuyTabIds = new Set<number>();
const readyUserbuyTabIds = new Set<number>();

export default defineBackground(main);

function main(): void {
  if (typeof BACKEND_API_KEY !== "string" || BACKEND_API_KEY.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_API_KEY");
  }
  if (typeof BACKEND_URL !== "string" || BACKEND_URL.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_URL");
  }

  onMessage("content:wait-dom-ready", handleContentWaitDomReady);
  onMessage("work:extracted", handleWorkExtracted);
  onMessage("home:open", handleHomeOpen);
  onMessage("home:ready", handleHomeReady);
  onMessage("home:hello", handleHomeHello);
  onMessage("circle:new", handleCircleNew);
  onMessage("userbuy:open", handleUserbuyOpen);
  onMessage("userbuy:ready", handleUserbuyReady);
  onMessage("userbuy:extracted", handleUserbuyExtracted);
  onMessage("cart:list", handleCartList);
  onMessage("download:list", handleDownloadList);

  browser.tabs.onRemoved.addListener((tabId) => {
    pendingHomeTabIds.delete(tabId);
    readyHomeTabIds.delete(tabId);
    pendingUserbuyTabIds.delete(tabId);
    readyUserbuyTabIds.delete(tabId);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
      readyUserbuyTabIds.delete(tabId);
    }
  });
}

/**
 * Content Scriptからの要求を受け、送信元タブのDOMの準備完了を待機する
 * @param data 待機タイムアウト（ミリ秒）を持つdata
 * @param sender メッセージ送信元の情報
 * @returns DOMが準備完了した場合は`true`、それ以外は`false`
 */
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

/**
 * 作品ページの情報を使ってコメント生成を開始する
 * @param message 抽出済みの作品情報を持つメッセージ
 */
async function handleWorkExtracted(message: { data: Work }): Promise<void> {
  const work: Work = message.data;
  try {
    await generateComment("work", { work });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

/**
 * 指定されたフロアを開き、Content Scriptの準備完了後に処理を開始する
 * @param message 開くフロア情報を持つメッセージ
 */
async function handleHomeOpen(message: { data: Home }): Promise<void> {
  const targetTabId = await openDLsite(message.data);

  if (targetTabId === undefined) {
    return;
  }

  pendingHomeTabIds.add(targetTabId);
  await triggerHomeIfReady(targetTabId);
}

/**
 * トップページのContent Scriptの準備完了を記録
 * @param sender メッセージ送信元の情報
 */
async function handleHomeReady({
  sender,
}: {
  sender: Browser.runtime.MessageSender;
}): Promise<void> {
  const tabId = sender.tab?.id;

  if (tabId === undefined) {
    return;
  }

  readyHomeTabIds.add(tabId);
  await triggerHomeIfReady(tabId);
}

/**
 * フロア名を使って挨拶コメントを生成する
 * @param message フロア名を持つメッセージ
 */
async function handleHomeHello(message: { data: string }): Promise<void> {
  const floor: string = message.data;
  try {
    await generateComment("home:hello", { floor });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

/**
 * サークルページから抽出された情報を使ってコメントを生成する
 * @param message サークルページの情報を持つメッセージ
 */
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

/** 購入履歴ページを開き、Content Scriptの準備完了後に抽出処理を開始する */
async function handleUserbuyOpen(): Promise<void> {
  const targetTabId: number | undefined = await openUserbuy();
  if (targetTabId === undefined) {
    return;
  }

  pendingUserbuyTabIds.add(targetTabId);
  await triggerUserbuyIfReady(targetTabId);
}

/**
 * 購入履歴のContent Scriptの準備完了を記録する
 * @param sender メッセージ送信元の情報
 */
async function handleUserbuyReady({
  sender,
}: {
  sender: Browser.runtime.MessageSender;
}): Promise<void> {
  const tabId = sender.tab?.id;

  if (tabId === undefined) {
    return;
  }

  readyUserbuyTabIds.add(tabId);
  await triggerUserbuyIfReady(tabId);
}

/**
 * 購入履歴から抽出された作品一覧の情報を使ってコメントを生成する
 * @param message 購入履歴の作品一覧を持つメッセージ
 */
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

/**
 * カートから抽出された情報を使ってコメントを生成する
 * @param message カート内の作品一覧と合計金額を持つメッセージ
 */
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

/**
 * 購入後ページの情報を使ってコメントを生成する
 * @param message 購入後ページの購入作品一覧を持つメッセージ
 */
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

/**
 * 指定タブのDOMContentLoadedを待機する
 * @param tabId 対象タブのID
 * @param timeoutMs 待機する最大時間（ミリ秒）
 * @returns DOM が準備完了した場合は`true`、タイムアウトまたは失敗時は`false`
 */
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

/**
 * 指定されたフロアを現在のタブまたは新しいタブで開く
 * @param home 開くフロアの情報
 * @returns 対象タブのID。タブを取得できない場合は`undefined`
 */
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

  return targetTabId;
}

/**
 * ホームタブが要求済みかつ準備完了の場合に、抽出開始メッセージを送信する
 * @param tabId 対象タブのID
 */
async function triggerHomeIfReady(tabId: number): Promise<void> {
  if (!pendingHomeTabIds.has(tabId) || !readyHomeTabIds.has(tabId)) {
    return;
  }

  pendingHomeTabIds.delete(tabId);
  readyHomeTabIds.delete(tabId);

  try {
    await sendMessage("home:triggered", undefined, tabId);
  } catch (err) {
    console.error("Failed to send 'home:triggered':", err);
  }
}

/**
 * 購入履歴ページを現在のタブまたは新しいタブで開く
 * @returns 対象タブのID。タブを取得できない場合は`undefined`
 */
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

  return targetTabId;
}

/**
 * 購入履歴タブが要求済みかつ準備完了の場合に、抽出開始メッセージを送信する
 * @param tabId 対象タブのID
 */
async function triggerUserbuyIfReady(tabId: number): Promise<void> {
  if (!pendingUserbuyTabIds.has(tabId) || !readyUserbuyTabIds.has(tabId)) {
    return;
  }

  pendingUserbuyTabIds.delete(tabId);
  readyUserbuyTabIds.delete(tabId);

  try {
    await sendMessage("userbuy:triggered", undefined, tabId);
  } catch (err) {
    console.error("Failed to send 'userbuy:triggered':", err);
  }
}

/**
 * 指定usecaseのデータをバックエンドへ送信し、ストリーミングされたコメントを処理する
 * @param usecase コメント生成のusecase
 * @param payload usecaseごとの入力データ
 */
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
    previousResponseId: previousResponseId ?? null,
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

/**
 * URLがDLsiteの購入履歴ページか判定する
 * @param url 判定対象のURL
 * @returns 購入履歴ページの場合は`true`
 */
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

/**
 * コメントストリームの1行を解析し、チャンクの処理または完了処理を実行する
 * @param line JSON Lines形式の1行
 * @param previousResponseIdKey 前回レスポンスIDの保存キー
 * @param commentHistoryKey コメント履歴の保存キー
 * @param currentComment 現在生成中のコメント
 */
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

/**
 * 値が有効なコメントストリームイベントか判定する
 * @param value 判定対象の値
 * @returns `delta`または`done`イベントとして有効な場合は`true`
 */
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

/**
 * storage内のコメント履歴を取得し、保持期限を過ぎた項目を削除する
 * @param commentHistoryKey コメント履歴の保存キー
 * @returns 有効期限内のコメント履歴
 */
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

/**
 * コメント履歴から期限切れ項目を削除して保存する
 * @param commentHistoryKey コメント履歴の保存キー
 * @param commentHistory 保存するコメント履歴
 */
async function setCommentHistory(
  commentHistoryKey: `local:${string}`,
  commentHistory: CommentHistoryItem[],
): Promise<void> {
  await storage.setItem(
    commentHistoryKey,
    pruneExpiredCommentHistory(commentHistory),
  );
}

/**
 * 生成済みコメントを既存の履歴へ追加して保存する
 * @param commentHistoryKey コメント履歴の保存キー
 * @param comment 追加するコメント
 */
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
