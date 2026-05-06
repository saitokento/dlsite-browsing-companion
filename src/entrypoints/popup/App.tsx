import { useEffect, useState } from "react";
import { loadEnabledHomePaths } from "../options/App.tsx";
import "./App.css";

function App() {
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);

  useEffect(() => {
    loadEnabledHomePaths(setEnabledHomePaths);
  }, []);

  return (
    <>
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
