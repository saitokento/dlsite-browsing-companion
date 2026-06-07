import { CommentHistoryItem } from "@/utils/types.ts";

export const AUTO_COMMENT_ENABLED_KEY = "local:autoCommentEnabled";
export const CHARACTER_ID_KEY = "local:characterId";
export const COMMENT_HISTORY_RETENTION_DAYS = 30;
export const COMMENT_HISTORY_RETENTION_MS =
  COMMENT_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
export const ENABLED_HOME_PATHS_KEY = "local:enabledHomePaths";

export async function loadAutoCommentEnabled(): Promise<boolean> {
  return (await storage.getItem<boolean>(AUTO_COMMENT_ENABLED_KEY)) ?? true;
}

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

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}

export async function waitDomReady(timeoutMs: number): Promise<boolean> {
  const isDomReady = await sendMessage("content:wait-dom-ready", {
    timeoutMs,
  });

  if (!isDomReady) {
    console.warn("DOM was not ready before timeout.");
  }

  return isDomReady;
}

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
