import { CommentHistoryItem } from "@/utils/types.ts";

/** 自動コメント機能の有効状態を保存するstorageキー */
export const AUTO_COMMENT_ENABLED_KEY = "local:autoCommentEnabled";
/** 選択中のキャラクターIDを保存するstorageキー */
export const CHARACTER_ID_KEY = "local:characterId";
/** コメント履歴を保持する日数 */
export const COMMENT_HISTORY_RETENTION_DAYS = 30;
/** コメント履歴の保持期間をミリ秒で表した値 */
export const COMMENT_HISTORY_RETENTION_MS =
  COMMENT_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
/** ポップアップに表示するフロア一覧を保存するstorageキー */
export const ENABLED_HOME_PATHS_KEY = "local:enabledHomePaths";

/**
 * 自動コメント機能の有効状態をstorageから読み込む
 * @returns 保存値。未設定の場合は`true`
 */
export async function loadAutoCommentEnabled(): Promise<boolean> {
  return (await storage.getItem<boolean>(AUTO_COMMENT_ENABLED_KEY)) ?? true;
}

/**
 * 有効なフロアパス一覧を読み込み、指定のsetterへ反映する
 * @param setEnabledHomePaths 有効なフロアパス一覧を更新する関数
 */
export async function loadEnabledHomePaths(
  setEnabledHomePaths: (enabledHomePaths: string[]) => void,
) {
  const savedEnabledHomePaths = await storage.getItem<string[]>(
    ENABLED_HOME_PATHS_KEY,
  );

  if (savedEnabledHomePaths !== null) {
    setEnabledHomePaths(savedEnabledHomePaths);
    return;
  }

  setEnabledHomePaths(["/home/", "/soft/", "/garumani/voice"]);
}

/**
 * 文字列が定義済みのキャラクターIDか判定する
 * @param value 判定対象の文字列
 * @returns 有効なキャラクターIDの場合は`true`
 */
export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}

/**
 * Background経由で現在のタブのDOM準備完了を待機する
 * @param timeoutMs 待機する最大時間（ミリ秒）
 * @returns DOMが準備完了した場合は`true`
 */
export async function waitDomReady(timeoutMs: number): Promise<boolean> {
  const isDomReady = await sendMessage("content:wait-dom-ready", {
    timeoutMs,
  });

  if (!isDomReady) {
    console.warn("DOM was not ready before timeout.");
  }

  return isDomReady;
}

/**
 * 保持期限を過ぎたコメントと日時が不正なコメントを削除
 * @param commentHistory フィルタリング対象のコメント履歴
 * @returns 削除後のコメント履歴
 */
export function pruneExpiredCommentHistory(
  commentHistory: CommentHistoryItem[],
): CommentHistoryItem[] {
  const thresholdTime = Date.now() - COMMENT_HISTORY_RETENTION_MS;

  return commentHistory.filter((item) => {
    const createdAtTime = Date.parse(item.createdAt);

    if (Number.isNaN(createdAtTime)) {
      return false;
    }

    return createdAtTime >= thresholdTime;
  });
}
