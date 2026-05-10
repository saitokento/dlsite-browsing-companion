export const AUTO_COMMENT_ENABLED_KEY = "local:autoCommentEnabled";
export const CHARACTER_ID_KEY = "local:characterId";
export const DEBUG_MODE_KEY = "local:debugMode";
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
