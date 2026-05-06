import { useEffect, useState } from "react";
import { loadEnabledHomePaths } from "../options/App.tsx";
import "./App.css";

export const COMMENT_GENERATION_ENABLED_KEY = "local:commentGenerationEnabled";

function App() {
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);
  const [commentGenerationEnabled, setCommentGenerationEnabled] =
    useState(true);

  useEffect(() => {
    loadEnabledHomePaths(setEnabledHomePaths);
    void loadCommentGenerationEnabled().then(setCommentGenerationEnabled);
  }, []);

  async function handleCommentGenerationChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const enabled = event.currentTarget.checked;

    setCommentGenerationEnabled(enabled);
    await saveCommentGenerationEnabled(enabled);
  }

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={commentGenerationEnabled}
          onChange={handleCommentGenerationChange}
        />
        コメント生成
      </label>

      <div className="home-buttons">
        {homes
          .filter((home) => enabledHomePaths.includes(home.path))
          .map((home) => (
            <button
              key={home.path}
              type="button"
              onClick={() => openDLsite(home)}
            >
              {home.name}
            </button>
          ))}
      </div>
    </>
  );
}

export async function loadCommentGenerationEnabled(): Promise<boolean> {
  return (
    (await storage.getItem<boolean>(COMMENT_GENERATION_ENABLED_KEY)) ?? true
  );
}

export async function saveCommentGenerationEnabled(
  enabled: boolean,
): Promise<void> {
  await storage.setItem(COMMENT_GENERATION_ENABLED_KEY, enabled);
}

async function openDLsite(home: Home) {
  const sidePanelPromise = browser.windows
    .getCurrent()
    .then((win) =>
      win.id !== undefined
        ? browser.sidePanel.open({ windowId: win.id })
        : undefined,
    )
    .catch(console.error);

  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  const dlsiteUrl = `https://www.dlsite.com${home.path}`;

  if (
    activeTab?.id &&
    (activeTab.url === "chrome://newtab/" || activeTab.url === "about:newtab")
  ) {
    await browser.tabs.update(activeTab.id, {
      url: dlsiteUrl,
      active: true,
    });
  } else {
    const win = await browser.windows.getCurrent();
    await browser.tabs.create({
      windowId: win.id,
      url: dlsiteUrl,
      active: true,
    });
  }
  await sidePanelPromise;
}

export default App;
