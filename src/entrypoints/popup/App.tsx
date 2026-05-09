import { useEffect, useState } from "react";
import { loadEnabledHomePaths } from "../options/App.tsx";
import "./App.css";

export const AUTO_COMMENT_ENABLED_KEY = "local:autoCommentEnabled";

function App() {
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);
  const [autoCommentEnabled, setAutoCommentEnabled] = useState(true);

  useEffect(() => {
    loadEnabledHomePaths(setEnabledHomePaths);
    void loadAutoCommentEnabled().then(setAutoCommentEnabled);
  }, []);

  async function handleAutoCommentChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const enabled = event.currentTarget.checked;

    setAutoCommentEnabled(enabled);
    await saveAutoCommentEnabled(enabled);
  }

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={autoCommentEnabled}
          onChange={handleAutoCommentChange}
        />
        自動コメント
      </label>

      <div className="home-buttons">
        {homes
          .filter((home) => enabledHomePaths.includes(home.path))
          .map((home) => (
            <button
              key={home.path}
              type="button"
              onClick={() => handleOpenDLsiteClick(home)}
            >
              {home.name}
            </button>
          ))}
      </div>

      <button type="button" onClick={handleUserbuyTriggerClick}>
        購入履歴にコメントしてもらう
      </button>
    </>
  );
}

export async function loadAutoCommentEnabled(): Promise<boolean> {
  return (await storage.getItem<boolean>(AUTO_COMMENT_ENABLED_KEY)) ?? true;
}

export async function saveAutoCommentEnabled(enabled: boolean): Promise<void> {
  await storage.setItem(AUTO_COMMENT_ENABLED_KEY, enabled);
}

async function handleOpenDLsiteClick(home: Home) {
  const sidePanelPromise = openSidePanel().catch(console.error);

  await sendMessage("home:open", home).catch((err) => {
    console.error("Failed to send 'home:open':", err);
  });

  await sidePanelPromise;
}

async function handleUserbuyTriggerClick() {
  const sidePanelPromise = openSidePanel().catch(console.error);

  await sendMessage("userbuy:open").catch((err) => {
    console.error("Failed to send 'userbuy:open':", err);
  });

  await sidePanelPromise;
}

async function openSidePanel() {
  try {
    const win = await browser.windows.getCurrent();

    if (win.id === undefined) {
      return;
    }

    await browser.sidePanel.open({ windowId: win.id });
  } catch (err) {
    console.error(err);
  }
}

export default App;
